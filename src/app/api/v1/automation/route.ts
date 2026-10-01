import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getAuthContext, auditLog } from '@/lib/auth'
import { createAutomationSchema, parseBody } from '@/lib/validations'
import { NextRequest } from 'next/server'

// GET /api/v1/automation
// List all automation rules for the organization
export async function GET() {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    const rules = await db.automationRule.findMany({
      where: { organizationId: ctx.organization.id },
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

// POST /api/v1/automation
// Create a new automation rule
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    // Only ADMIN+ can create automation rules
    if (ctx.role !== 'OWNER' && ctx.role !== 'ADMIN' && ctx.role !== 'MANAGER') {
      return err('FORBIDDEN', 'Insufficient permissions', 403)
    }

    const body = await req.json().catch(() => ({}))
    const parsed = parseBody(createAutomationSchema, body)
    if (!parsed.success) return err('VALIDATION_ERROR', parsed.error, 400)

    const { name, description, trigger, triggerLabel, conditions, actions, enabled } = parsed.data

    const rule = await db.automationRule.create({
      data: {
        organizationId: ctx.organization.id,
        name,
        description: description || null,
        trigger,
        triggerLabel,
        conditions: JSON.stringify(conditions),
        actions: JSON.stringify(actions),
        enabled: enabled ?? true,
      },
    })

    await auditLog({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      action: 'AUTOMATION_CREATED',
      entityType: 'AutomationRule',
      entityId: rule.id,
      newData: { name, trigger },
    })

    return ok({
      rule: {
        id: rule.id,
        name: rule.name,
        trigger: rule.trigger,
        enabled: rule.enabled,
      },
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
