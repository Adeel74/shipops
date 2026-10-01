import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'

// GET /api/v1/dashboard
// Returns aggregated metrics for the organization.
export async function GET() {
  try {
    const org = await requireOrg()

    const [
      inTransit,
      delivered,
      delivered30d,
      rto30d,
      todaysOrders,
      pendingConfirmation,
      confirmed,
      activeShipments,
      attentionCases,
    ] = await Promise.all([
      db.order.count({ where: { organizationId: org.id, status: { in: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'SHIPMENT_CREATED'] } } }),
      db.order.count({ where: { organizationId: org.id, status: 'DELIVERED' } }),
      db.order.count({ where: { organizationId: org.id, status: 'DELIVERED', createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      db.order.count({ where: { organizationId: org.id, status: { in: ['RETURNING', 'RETURNED'] }, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      db.order.count({ where: { organizationId: org.id, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      db.order.count({ where: { organizationId: org.id, status: 'UNCONFIRMED' } }),
      db.order.count({ where: { organizationId: org.id, status: 'CONFIRMED' } }),
      db.shipment.count({ where: { organizationId: org.id, status: { in: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'SHIPMENT_CREATED'] } } }),
      db.attentionCase.count({ where: { organizationId: org.id, status: 'OPEN' } }),
    ])

    // Revenue (sum of delivered COD amounts)
    const deliveredOrders = await db.order.findMany({
      where: { organizationId: org.id, status: 'DELIVERED' },
      select: { totalAmount: true },
    })
    const codCollected = deliveredOrders.reduce((s, o) => s + o.totalAmount, 0)

    // Shipping cost (last 30d)
    const shipments = await db.shipment.findMany({
      where: { organizationId: org.id, shippedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      select: { shippingCost: true },
    })
    const shippingCost = shipments.reduce((s, sh) => s + (sh.shippingCost || 0), 0)

    const deliveryRate = delivered30d + rto30d > 0 ? Math.round((delivered30d / (delivered30d + rto30d)) * 1000) / 10 : 0
    const rtoRate = delivered30d + rto30d > 0 ? Math.round((rto30d / (delivered30d + rto30d)) * 1000) / 10 : 0

    return ok({
      inTransit,
      delivered,
      deliveryRate,
      inYourBank: codCollected,
      courierOwes: 0,
      shippingCost,
      taxWithheld: Math.round(codCollected * 0.015),
      todaysOrders,
      pendingConfirmation,
      confirmed,
      rto: rto30d,
      rtoRate,
      codCollected,
      courierPayable: shippingCost,
      courierReceivable: 0,
      avgDeliveryTime: 2.4,
      attentionCases,
      activeShipments,
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
