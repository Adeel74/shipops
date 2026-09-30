import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getSuperAdminContext } from '@/lib/super-admin'

// GET /api/v1/admin/stats
// Platform-wide statistics across all organizations
export async function GET() {
  try {
    const ctx = await getSuperAdminContext()
    if (!ctx) return err('FORBIDDEN', 'Super admin access required', 403)

    const [
      totalOrgs,
      totalUsers,
      totalOrders,
      totalCustomers,
      totalCouriers,
      totalProducts,
      totalShipments,
      totalAttentionCases,
      totalWhatsappMessages,
      totalAuditLogs,
      activeStores,
      superAdmins,
    ] = await Promise.all([
      db.organization.count(),
      db.user.count(),
      db.order.count(),
      db.customer.count(),
      db.courierAccount.count(),
      db.product.count(),
      db.shipment.count(),
      db.attentionCase.count({ where: { status: 'OPEN' } }),
      db.whatsAppMessage.count(),
      db.auditLog.count(),
      db.store.count({ where: { status: 'ACTIVE' } }),
      db.user.count({ where: { isSuperAdmin: true } }),
    ])

    // Orders by status
    const ordersByStatus = await db.order.groupBy({
      by: ['status'],
      _count: true,
    })

    // Revenue (sum of delivered order amounts)
    const deliveredOrders = await db.order.findMany({
      where: { status: 'DELIVERED' },
      select: { totalAmount: true, shippingFee: true },
    })
    const totalRevenue = deliveredOrders.reduce((s, o) => s + o.totalAmount, 0)
    const totalShipping = deliveredOrders.reduce((s, o) => s + o.shippingFee, 0)

    // New signups last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const newUsers7d = await db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } })
    const newOrgs7d = await db.organization.count({ where: { createdAt: { gte: sevenDaysAgo } } })
    const newOrders7d = await db.order.count({ where: { createdAt: { gte: sevenDaysAgo } } })

    // Organizations with order counts (top 5)
    const orgsWithOrders = await db.organization.findMany({
      include: {
        _count: { select: { orders: true, members: true, customers: true } },
        orders: { where: { status: 'DELIVERED' }, select: { totalAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const orgStats = orgsWithOrders.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt.toISOString(),
      totalOrders: org._count.orders,
      totalMembers: org._count.members,
      totalCustomers: org._count.customers,
      revenue: org.orders.reduce((s, o) => s + o.totalAmount, 0),
    }))

    return ok({
      totals: {
        organizations: totalOrgs,
        users: totalUsers,
        orders: totalOrders,
        customers: totalCustomers,
        couriers: totalCouriers,
        products: totalProducts,
        shipments: totalShipments,
        openAttentionCases: totalAttentionCases,
        whatsappMessages: totalWhatsappMessages,
        auditLogs: totalAuditLogs,
        activeStores,
        superAdmins,
      },
      revenue: {
        totalRevenue,
        totalShipping,
        netRevenue: totalRevenue - totalShipping,
      },
      growth: {
        newUsers7d,
        newOrgs7d,
        newOrders7d,
      },
      ordersByStatus: ordersByStatus.map((s) => ({ status: s.status, count: s._count })),
      organizations: orgStats,
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
