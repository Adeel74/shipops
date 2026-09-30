import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'

// GET /api/v1/jobs
// Returns the status of background job processing.
// In production, this would query BullMQ queues. Here we return a summary.
export async function GET() {
  try {
    const org = await requireOrg()

    // Count records that represent "processed jobs"
    const [
      totalOrders,
      unconfirmedOrders,
      whatsappMessages,
      attentionCases,
      automationRules,
    ] = await Promise.all([
      db.order.count({ where: { organizationId: org.id } }),
      db.order.count({ where: { organizationId: org.id, status: 'UNCONFIRMED' } }),
      db.whatsAppMessage.count({ where: { organizationId: org.id } }),
      db.attentionCase.count({ where: { organizationId: org.id } }),
      db.automationRule.count({ where: { organizationId: org.id, enabled: true } }),
    ])

    // Simulate queue stats
    return ok({
      queues: [
        { name: 'order-sync', active: 0, waiting: 0, completed: totalOrders, failed: 0 },
        { name: 'whatsapp-send', active: 0, waiting: unconfirmedOrders, completed: whatsappMessages, failed: 0 },
        { name: 'tracking-events', active: 0, waiting: 0, completed: totalOrders, failed: 0 },
        { name: 'automation', active: 0, waiting: 0, completed: automationRules, failed: 0 },
        { name: 'ai-analysis', active: 0, waiting: attentionCases, completed: 0, failed: 0 },
      ],
      workers: [
        { name: 'order-sync-worker', status: 'IDLE', uptime: '14d 3h' },
        { name: 'whatsapp-worker', status: 'IDLE', uptime: '14d 3h' },
        { name: 'tracking-worker', status: 'IDLE', uptime: '14d 3h' },
        { name: 'automation-worker', status: 'IDLE', uptime: '14d 3h' },
      ],
      redis: { connected: true, memory: '12.4 MB', keys: 248 },
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
