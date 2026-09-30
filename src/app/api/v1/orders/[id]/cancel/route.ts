import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'

// POST /api/v1/orders/:id/cancel
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const org = await requireOrg()
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const reason = body.reason || 'Cancelled by operator'

    const order = await db.order.findFirst({ where: { id, organizationId: org.id } })
    if (!order) return err('NOT_FOUND', 'Order not found', 404)

    const oldStatus = order.status
    await db.order.update({ where: { id }, data: { status: 'CANCELLED' } })

    await db.orderStatusHistory.create({
      data: {
        orderId: order.id,
        oldStatus,
        newStatus: 'CANCELLED',
        reason,
        source: 'API',
      },
    })

    return ok({ orderId: order.id, status: 'CANCELLED' })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
