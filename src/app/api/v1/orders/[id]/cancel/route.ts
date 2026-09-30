import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getAuthContext, auditLog } from '@/lib/auth'
import { cancelOrderSchema, parseBody } from '@/lib/validations'
import { NextRequest } from 'next/server'

// POST /api/v1/orders/:id/cancel
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const parsed = parseBody(cancelOrderSchema, body)
    if (!parsed.success) return err('VALIDATION_ERROR', parsed.error, 400)

    const reason = parsed.data.reason || 'Cancelled by operator'

    const order = await db.order.findFirst({ where: { id, organizationId: ctx.organization.id } })
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

    await auditLog({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      action: 'ORDER_CANCELLED',
      entityType: 'Order',
      entityId: order.id,
      oldData: { status: oldStatus },
      newData: { status: 'CANCELLED', reason, orderNumber: order.orderNumber },
    })

    return ok({ orderId: order.id, status: 'CANCELLED' })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
