import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'

// POST /api/v1/orders/:id/create-shipment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const org = await requireOrg()
    const { id } = await params
    const body = await req.json()
    const { courierAccountId } = body

    if (!courierAccountId) return err('VALIDATION_ERROR', 'courierAccountId is required', 400)

    const order = await db.order.findFirst({ where: { id, organizationId: org.id } })
    if (!order) return err('NOT_FOUND', 'Order not found', 404)

    const courierAccount = await db.courierAccount.findFirst({
      where: { id: courierAccountId, organizationId: org.id },
    })
    if (!courierAccount) return err('NOT_FOUND', 'Courier account not found', 404)

    // Generate tracking number (demo — real integration would call courier API)
    const prefix = courierAccount.provider.slice(0, 3).toUpperCase()
    const trackingNumber = `${prefix}-${Math.floor(Math.random() * 90000000 + 10000000)}`

    const oldStatus = order.status
    const shipment = await db.shipment.create({
      data: {
        organizationId: org.id,
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
