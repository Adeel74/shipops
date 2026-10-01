import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getAuthContext } from '@/lib/auth'
import { NextRequest } from 'next/server'

// GET /api/v1/search?q=...
// Global search across orders, customers, and tracking numbers.
export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    const q = req.nextUrl.searchParams.get('q') || ''
    if (q.length < 2) return ok({ results: { orders: [], customers: [], shipments: [] } })

    const orgId = ctx.organization.id

    // Search orders by order number, customer name, or tracking number
    const orders = await db.order.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { orderNumber: { contains: q } },
          { trackingNumber: { contains: q } },
          { customer: { OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { phone: { contains: q } },
          ] } },
        ],
      },
      include: {
        customer: { include: { addresses: { where: { isDefault: true }, take: 1 } } },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    // Search customers by name, phone, email
    const customers = await db.customer.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { phone: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 10,
    })

    // Search shipments by tracking number
    const shipments = await db.shipment.findMany({
      where: {
        organizationId: orgId,
        trackingNumber: { contains: q },
      },
      include: { order: { select: { orderNumber: true, customer: { select: { firstName: true, lastName: true } } } } },
      take: 5,
    })

    return ok({
      results: {
        orders: orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.trim(),
          city: o.customer.addresses[0]?.city || '',
          status: o.status,
          codAmount: o.totalAmount,
          createdAt: o.createdAt.toISOString(),
        })),
        customers: customers.map((c) => ({
          id: c.id,
          name: `${c.firstName || ''} ${c.lastName || ''}`.trim(),
          phone: c.phone || '',
          email: c.email || '',
          city: '',
          riskLevel: c.riskLevel,
          totalOrders: c.totalOrders,
        })),
        shipments: shipments.map((s) => ({
          id: s.id,
          trackingNumber: s.trackingNumber,
          status: s.status,
          orderNumber: s.order.orderNumber,
          customerName: `${s.order.customer.firstName || ''} ${s.order.customer.lastName || ''}`.trim(),
        })),
      },
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
