import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getAuthContext } from '@/lib/auth'

// GET /api/v1/notifications
// Returns real-time alerts derived from the database:
// - Urgent attention cases
// - High-risk orders
// - Courier API errors / stuck shipments
// - Recent confirmations
export async function GET() {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    const orgId = ctx.organization.id
    const notifications: Array<{
      id: string
      title: string
      description: string
      type: 'URGENT' | 'WARNING' | 'INFO' | 'SUCCESS'
      time: string
      actionUrl?: string
    }> = []

    // 1. Urgent attention cases
    const urgentCases = await db.attentionCase.findMany({
      where: { organizationId: orgId, status: 'OPEN', priority: 'URGENT' },
      include: { order: { select: { orderNumber: true } } },
      take: 5,
    })
    for (const c of urgentCases) {
      notifications.push({
        id: `notif_case_${c.id}`,
        title: `Urgent: ${c.order?.orderNumber || 'Order'} — ${c.title}`,
        description: c.description || '',
        type: 'URGENT',
        time: c.createdAt.toISOString(),
        actionUrl: '/attention',
      })
    }

    // 2. High-priority attention cases
    const highCases = await db.attentionCase.findMany({
      where: { organizationId: orgId, status: 'OPEN', priority: 'HIGH' },
      include: { order: { select: { orderNumber: true } } },
      take: 5,
    })
    for (const c of highCases) {
      notifications.push({
        id: `notif_case_${c.id}`,
        title: `${c.order?.orderNumber || 'Order'} — ${c.title}`,
        description: c.description || '',
        type: 'WARNING',
        time: c.createdAt.toISOString(),
        actionUrl: '/attention',
      })
    }

    // 3. High-risk unconfirmed orders
    const highRiskOrders = await db.order.findMany({
      where: { organizationId: orgId, status: 'UNCONFIRMED', riskLevel: 'HIGH' },
      select: { id: true, orderNumber: true, customer: { select: { firstName: true, lastName: true } } },
      take: 5,
    })
    for (const o of highRiskOrders) {
      notifications.push({
        id: `notif_risk_${o.id}`,
        title: `High RTO risk: ${o.orderNumber}`,
        description: `Customer ${o.customer.firstName} ${o.customer.lastName} flagged as HIGH risk`,
        type: 'WARNING',
        time: new Date().toISOString(),
        actionUrl: '/unconfirmed',
      })
    }

    // 4. Recently confirmed orders (success)
    const recentConfirmed = await db.order.findMany({
      where: { organizationId: orgId, status: 'CONFIRMED', confirmedAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } },
      select: { id: true, orderNumber: true, customer: { select: { firstName: true, lastName: true } }, confirmedAt: true },
      take: 5,
      orderBy: { confirmedAt: 'desc' },
    })
    for (const o of recentConfirmed) {
      notifications.push({
        id: `notif_confirmed_${o.id}`,
        title: `${o.customer.firstName} ${o.customer.lastName} confirmed ${o.orderNumber}`,
        description: 'Order ready for dispatch',
        type: 'SUCCESS',
        time: o.confirmedAt?.toISOString() || new Date().toISOString(),
        actionUrl: '/confirmed',
      })
    }

    // 5. Stuck shipments (in transit > 48h)
    const stuckShipments = await db.shipment.findMany({
      where: {
        organizationId: orgId,
        status: { in: ['IN_TRANSIT', 'SHIPMENT_CREATED'] },
        shippedAt: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
      include: { order: { select: { orderNumber: true } } },
      take: 5,
    })
    for (const s of stuckShipments) {
      notifications.push({
        id: `notif_stuck_${s.id}`,
        title: `Shipment stuck: ${s.order.orderNumber}`,
        description: `In transit for over 48 hours. Tracking: ${s.trackingNumber}`,
        type: 'WARNING',
        time: s.shippedAt?.toISOString() || new Date().toISOString(),
        actionUrl: '/tracking',
      })
    }

    // Sort by time (most recent first)
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return ok({
      notifications: notifications.slice(0, 20),
      unread: notifications.filter((n) => n.type === 'URGENT' || n.type === 'WARNING').length,
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
