import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'

// GET /api/v1/automation
export async function GET() {
  try {
    const org = await requireOrg()
    const rules = await db.automationRule.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'asc' },
    })

    return ok({
      rules: rules.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        trigger: r.trigger,
        triggerLabel: r.triggerLabel,
        conditions: JSON.parse(r.conditions),
        actions: JSON.parse(r.actions),
        enabled: r.enabled,
        runsLast30Days: r.runsLast30Days,
        successRate: r.successRate,
        lastRunAt: r.lastRunAt?.toISOString() || undefined,
      })),
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
