import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'

// GET /api/v1/orders/:id — full order detail with evidence
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const org = await requireOrg()
    const { id } = await params

    const order = await db.order.findFirst({
      where: { id, organizationId: org.id },
      include: {
        items: true,
        customer: { include: { addresses: true } },
        shipment: { include: { trackingEvents: { orderBy: { eventTime: 'asc' } }, courierAccount: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        attentionCases: true,
      },
    })

    if (!order) return err('NOT_FOUND', 'Order not found', 404)

    const evidence = await db.evidenceItem.findMany({
      where: { orderId: order.id },
      orderBy: { timestamp: 'asc' },
    })

    return ok({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        shopifyOrderId: order.shopifyOrderId,
        customer: {
          id: order.customer.id,
          name: `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim(),
          phone: order.customer.phone,
          email: order.customer.email,
          riskScore: order.customer.riskScore,
          riskLevel: order.customer.riskLevel,
          totalOrders: order.customer.totalOrders,
          deliveredOrders: order.customer.deliveredOrders,
          returnedOrders: order.customer.returnedOrders,
        },
        addresses: order.customer.addresses.map((a) => ({
          id: a.id,
          addressLine1: a.addressLine1,
          city: a.city,
          isDefault: a.isDefault,
        })),
        items: order.items,
        status: order.status,
        riskScore: order.riskScore,
        riskLevel: order.riskLevel,
        codAmount: order.totalAmount,
        shippingFee: order.shippingFee,
        totalAmount: order.totalAmount,
        isCod: order.isCod,
        confirmationMethod: order.confirmationMethod,
        confirmedAt: order.confirmedAt?.toISOString(),
        courier: order.courier,
        trackingNumber: order.trackingNumber,
        attentionType: order.attentionType,
        attentionReason: order.attentionReason,
        returnReason: order.returnReason,
        recommendedAction: order.recommendedAction,
        createdAt: order.createdAt.toISOString(),
        shipment: order.shipment
          ? {
              id: order.shipment.id,
              trackingNumber: order.shipment.trackingNumber,
              status: order.shipment.status,
              shippingCost: order.shipment.shippingCost,
              codAmount: order.shipment.codAmount,
              shippedAt: order.shipment.shippedAt?.toISOString(),
              deliveredAt: order.shipment.deliveredAt?.toISOString(),
              events: order.shipment.trackingEvents.map((e) => ({
                id: e.id,
                status: e.status,
                description: e.description,
                location: e.location,
                eventTime: e.eventTime.toISOString(),
                source: e.source,
                isWarning: e.isWarning,
              })),
            }
          : null,
        statusHistory: order.statusHistory.map((h) => ({
          id: h.id,
          oldStatus: h.oldStatus,
          newStatus: h.newStatus,
          reason: h.reason,
          source: h.source,
          createdAt: h.createdAt.toISOString(),
        })),
        evidence: evidence.map((e) => ({
          id: e.id,
          type: e.type,
          title: e.title,
          detail: e.detail,
          timestamp: e.timestamp.toISOString(),
          source: e.source,
        })),
        attentionCases: order.attentionCases.map((c) => ({
          id: c.id,
          type: c.type,
          priority: c.priority,
          status: c.status,
          title: c.title,
          description: c.description,
          recommendedAction: c.recommendedAction,
          aiConfidence: c.aiConfidence,
          createdAt: c.createdAt.toISOString(),
        })),
      },
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}

// PATCH /api/v1/orders/:id — update order (e.g. confirm, cancel, change status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const org = await requireOrg()
    const { id } = await params
    const body = await req.json()
    const { status, confirmedAt, attentionType, attentionReason } = body

    const order = await db.order.findFirst({ where: { id, organizationId: org.id } })
    if (!order) return err('NOT_FOUND', 'Order not found', 404)

    const oldStatus = order.status
    const updated = await db.order.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(confirmedAt !== undefined ? { confirmedAt: confirmedAt ? new Date(confirmedAt) : null } : {}),
        ...(attentionType !== undefined ? { attentionType } : {}),
        ...(attentionReason !== undefined ? { attentionReason } : {}),
      },
    })

    if (status && status !== oldStatus) {
      await db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          oldStatus,
          newStatus: status,
          source: 'API',
        },
      })
    }

    return ok({ order: { id: updated.id, status: updated.status } })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
