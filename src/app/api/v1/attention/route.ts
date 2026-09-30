import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'

// GET /api/v1/attention
export async function GET(req: NextRequest) {
  try {
    const org = await requireOrg()
    const status = req.nextUrl.searchParams.get('status') || 'OPEN'

    const cases = await db.attentionCase.findMany({
      where: { organizationId: org.id, status: status === 'ALL' ? undefined : status },
      include: { order: { include: { customer: { include: { addresses: { where: { isDefault: true }, take: 1 } } } } } },
      orderBy: { createdAt: 'desc' },
    })

    return ok({
      cases: cases.map((c) => {
        const order = c.order
        const customer = order?.customer
        const address = customer?.addresses[0]
        return {
          id: c.id,
          orderId: order?.id || '',
          orderNumber: order?.orderNumber || '',
          customerName: customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : '',
          city: address?.city || '',
          type: c.type,
          title: c.title,
          description: c.description || '',
          priority: c.priority,
          status: c.status,
          overdueHours: Math.floor((Date.now() - c.createdAt.getTime()) / (60 * 60 * 1000)),
          recommendedAction: c.recommendedAction || '',
          aiConfidence: c.aiConfidence || 0,
          createdAt: c.createdAt.toISOString(),
        }
      }),
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
