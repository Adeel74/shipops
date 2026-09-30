import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getSuperAdminContext } from '@/lib/super-admin'
import { NextRequest } from 'next/server'

// GET /api/v1/admin/orders
// List all orders across all organizations
export async function GET(req: NextRequest) {
  try {
    const ctx = await getSuperAdminContext()
    if (!ctx) return err('FORBIDDEN', 'Super admin access required', 403)

    const status = req.nextUrl.searchParams.get('status') || 'ALL'
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')

    const orders = await db.order.findMany({
      where: status !== 'ALL' ? { status } : undefined,
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        customer: { select: { firstName: true, lastName: true, phone: true } },
        items: { select: { title: true, quantity: true, totalPrice: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return ok({
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        isCod: o.isCod,
        totalAmount: o.totalAmount,
        riskLevel: o.riskLevel,
        riskScore: o.riskScore,
        courier: o.courier,
        trackingNumber: o.trackingNumber,
        createdAt: o.createdAt.toISOString(),
        organization: o.organization,
        customer: {
          name: `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.trim(),
          phone: o.customer.phone,
        },
        items: o.items,
      })),
      total: orders.length,
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
