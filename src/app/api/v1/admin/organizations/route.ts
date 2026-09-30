import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getSuperAdminContext } from '@/lib/super-admin'
import { NextRequest } from 'next/server'

// GET /api/v1/admin/organizations
// List all organizations with stats
export async function GET(req: NextRequest) {
  try {
    const ctx = await getSuperAdminContext()
    if (!ctx) return err('FORBIDDEN', 'Super admin access required', 403)

    const search = req.nextUrl.searchParams.get('q') || ''
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100')

    const orgs = await db.organization.findMany({
      where: search ? {
        OR: [
          { name: { contains: search } },
          { slug: { contains: search } },
        ]
      } : undefined,
      include: {
        members: { include: { user: { select: { name: true, email: true } } } },
        stores: { select: { id: true, shopDomain: true, status: true, platform: true } },
        _count: {
          select: {
            orders: true,
            customers: true,
            products: true,
            couriers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Get order stats per org
    const orgsWithStats = await Promise.all(
      orgs.map(async (org) => {
        const owner = org.members.find((m) => m.role === 'OWNER')
        const orderStats = await db.order.groupBy({
          by: ['status'],
          where: { organizationId: org.id },
          _count: true,
        })
        const delivered = orderStats.find((s) => s.status === 'DELIVERED')?._count || 0
        const revenue = await db.order.aggregate({
          where: { organizationId: org.id, status: 'DELIVERED' },
          _sum: { totalAmount: true },
        })

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          country: org.country,
          timezone: org.timezone,
          currency: org.currency,
          status: org.status,
          planId: org.planId,
          createdAt: org.createdAt.toISOString(),
          owner: owner ? { name: owner.user.name, email: owner.user.email } : null,
          stores: org.stores,
          stats: {
            totalOrders: org._count.orders,
            totalCustomers: org._count.customers,
            totalProducts: org._count.products,
            totalCouriers: org._count.couriers,
            deliveredOrders: delivered,
            revenue: revenue._sum.totalAmount || 0,
          },
        }
      })
    )

    return ok({ organizations: orgsWithStats, total: orgsWithStats.length })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
