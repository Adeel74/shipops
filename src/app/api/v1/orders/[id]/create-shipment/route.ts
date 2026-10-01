import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getAuthContext, auditLog } from '@/lib/auth'
import { createShipmentSchema, parseBody } from '@/lib/validations'
import { NextRequest } from 'next/server'

// POST /api/v1/orders/:id/create-shipment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const parsed = parseBody(createShipmentSchema, body)
    if (!parsed.success) return err('VALIDATION_ERROR', parsed.error, 400)

    const { courierAccountId } = parsed.data

    const order = await db.order.findFirst({ where: { id, organizationId: ctx.organization.id } })
    if (!order) return err('NOT_FOUND', 'Order not found', 404)

    const courierAccount = await db.courierAccount.findFirst({
      where: { id: courierAccountId, organizationId: ctx.organization.id },
    })
    if (!courierAccount) return err('NOT_FOUND', 'Courier account not found', 404)

    // Generate tracking number (demo — real integration would call courier API)
    const prefix = courierAccount.provider.slice(0, 3).toUpperCase()
    const trackingNumber = `${prefix}-${Math.floor(Math.random() * 90000000 + 10000000)}`

    const oldStatus = order.status
    const shipment = await db.shipment.create({
      data: {
        organizationId: ctx.organization.id,
        orderId: order.id,
        courierAccountId: courierAccount.id,
        trackingNumber,
        externalId: `ext_${trackingNumber}`,
        status: 'SHIPMENT_CREATED',
        shippingCost: 220,
        codAmount: order.totalAmount,
        shippedAt: new Date(),
      },
    })

    await db.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: 'Shipment Created',
        description: `Shipment booked with ${courierAccount.provider}`,
        eventTime: new Date(),
        source: 'SHIPOPS',
      },
    })

    await db.order.update({
      where: { id },
      data: {
        status: 'SHIPMENT_CREATED',
        courier: courierAccount.provider,
        trackingNumber,
      },
    })

    await db.orderStatusHistory.create({
      data: {
        orderId: order.id,
        oldStatus,
        newStatus: 'SHIPMENT_CREATED',
        reason: `Shipment created with ${courierAccount.provider}`,
        source: 'API',
      },
    })

    await auditLog({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      action: 'SHIPMENT_CREATED',
      entityType: 'Shipment',
      entityId: shipment.id,
      newData: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        courier: courierAccount.provider,
        trackingNumber,
      },
    })

    return ok({
      orderId: order.id,
      shipmentId: shipment.id,
      trackingNumber,
      courier: courierAccount.provider,
      status: 'SHIPMENT_CREATED',
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
