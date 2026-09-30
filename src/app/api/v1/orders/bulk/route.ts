import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getAuthContext, auditLog } from '@/lib/auth'
import { NextRequest } from 'next/server'

// POST /api/v1/orders/bulk
// Body: { action: 'confirm' | 'cancel', orderIds: string[] }
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    const body = await req.json()
    const { action, orderIds } = body

    if (!action || !['confirm', 'cancel'].includes(action)) {
      return err('VALIDATION_ERROR', 'action must be "confirm" or "cancel"', 400)
    }
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return err('VALIDATION_ERROR', 'orderIds must be a non-empty array', 400)
    }
    if (orderIds.length > 100) {
      return err('VALIDATION_ERROR', 'Maximum 100 orders per bulk operation', 400)
    }

    const orders = await db.order.findMany({
      where: { id: { in: orderIds }, organizationId: ctx.organization.id },
    })

    if (orders.length === 0) return err('NOT_FOUND', 'No matching orders found', 404)

    const newStatus = action === 'confirm' ? 'CONFIRMED' : 'CANCELLED'
    const results: Array<{ id: string; orderNumber: string; success: boolean; error?: string }> = []

    for (const order of orders) {
      try {
        const oldStatus = order.status

        if (action === 'confirm') {
          await db.order.update({
            where: { id: order.id },
            data: { status: 'CONFIRMED', confirmationMethod: 'MANUAL', confirmedAt: new Date() },
          })
        } else {
          await db.order.update({
            where: { id: order.id },
            data: { status: 'CANCELLED' },
          })
        }

        await db.orderStatusHistory.create({
          data: {
            orderId: order.id,
            oldStatus,
            newStatus,
            reason: `Bulk ${action}ed by ${ctx.user.name}`,
            source: 'API_BULK',
          },
        })

        await auditLog({
          organizationId: ctx.organization.id,
          userId: ctx.user.id,
          action: action === 'confirm' ? 'ORDER_CONFIRMED' : 'ORDER_CANCELLED',
          entityType: 'Order',
          entityId: order.id,
          oldData: { status: oldStatus },
          newData: { status: newStatus, orderNumber: order.orderNumber, bulk: true },
        })

        results.push({ id: order.id, orderNumber: order.orderNumber, success: true })
      } catch (e) {
        results.push({ id: order.id, orderNumber: order.orderNumber, success: false, error: (e as Error).message })
      }
    }

    const succeeded = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return ok({
      action,
      total: orders.length,
      succeeded,
      failed,
      results,
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
