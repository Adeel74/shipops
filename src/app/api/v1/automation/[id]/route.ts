import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getAuthContext, auditLog } from '@/lib/auth'
import { NextRequest } from 'next/server'

// PATCH /api/v1/automation/:id
// Update an automation rule (toggle enabled, edit name/description/conditions/actions)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    if (ctx.role !== 'OWNER' && ctx.role !== 'ADMIN' && ctx.role !== 'MANAGER') {
      return err('FORBIDDEN', 'Insufficient permissions', 403)
    }

    const { id } = await params
    const body = await req.json().catch(() => ({}))

    const rule = await db.automationRule.findFirst({
      where: { id, organizationId: ctx.organization.id },
    })
    if (!rule) return err('NOT_FOUND', 'Automation rule not found', 404)

    const updateData: Record<string, unknown> = {}
    if (body.enabled !== undefined) updateData.enabled = body.enabled
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.trigger !== undefined) {
      updateData.trigger = body.trigger
      updateData.triggerLabel = body.triggerLabel || body.trigger
    }
    if (body.conditions !== undefined) updateData.conditions = JSON.stringify(body.conditions)
    if (body.actions !== undefined) updateData.actions = JSON.stringify(body.actions)

    const updated = await db.automationRule.update({
      where: { id },
      data: updateData,
    })

    await auditLog({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      action: 'AUTOMATION_UPDATED',
      entityType: 'AutomationRule',
      entityId: rule.id,
      oldData: { enabled: rule.enabled, name: rule.name },
      newData: updateData,
    })

    return ok({
      rule: {
        id: updated.id,
        name: updated.name,
        enabled: updated.enabled,
      },
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}

// DELETE /api/v1/automation/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    if (ctx.role !== 'OWNER' && ctx.role !== 'ADMIN') {
      return err('FORBIDDEN', 'Only owners and admins can delete rules', 403)
    }

    const { id } = await params
    const rule = await db.automationRule.findFirst({
      where: { id, organizationId: ctx.organization.id },
    })
    if (!rule) return err('NOT_FOUND', 'Automation rule not found', 404)

    await db.automationRule.delete({ where: { id } })

    await auditLog({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      action: 'AUTOMATION_DELETED',
      entityType: 'AutomationRule',
      entityId: rule.id,
      oldData: { name: rule.name, trigger: rule.trigger },
    })

    return ok({ deleted: true, id })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
