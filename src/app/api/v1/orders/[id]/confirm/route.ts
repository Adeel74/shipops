import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getAuthContext, auditLog } from '@/lib/auth'
import { confirmOrderSchema, parseBody } from '@/lib/validations'
import { NextRequest } from 'next/server'

// POST /api/v1/orders/:id/confirm
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const parsed = parseBody(confirmOrderSchema, body)
    if (!parsed.success) return err('VALIDATION_ERROR', parsed.error, 400)

    const method = parsed.data.method || 'MANUAL'

    const order = await db.order.findFirst({ where: { id, organizationId: ctx.organization.id } })
    if (!order) return err('NOT_FOUND', 'Order not found', 404)

    const oldStatus = order.status
    await db.order.update({
      where: { id },
      data: { status: 'CONFIRMED', confirmationMethod: method, confirmedAt: new Date() },
    })

    await db.orderStatusHistory.create({
      data: {
        orderId: order.id,
        oldStatus,
        newStatus: 'CONFIRMED',
        reason: `Confirmed via ${method}`,
        source: 'API',
      },
    })

    // Audit log
    await auditLog({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      action: 'ORDER_CONFIRMED',
      entityType: 'Order',
      entityId: order.id,
      oldData: { status: oldStatus },
      newData: { status: 'CONFIRMED', method, orderNumber: order.orderNumber },
    })

    return ok({ orderId: order.id, status: 'CONFIRMED' })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
