import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getSuperAdminContext } from '@/lib/super-admin'
import { auditLog } from '@/lib/auth'
import { NextRequest } from 'next/server'

// PATCH /api/v1/admin/organizations/:id
// Update org: suspend/activate, assign plan
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getSuperAdminContext()
    if (!ctx) return err('FORBIDDEN', 'Super admin access required', 403)

    const { id } = await params
    const body = await req.json()
    const { action, planId, name } = body

    const org = await db.organization.findUnique({ where: { id } })
    if (!org) return err('NOT_FOUND', 'Organization not found', 404)

    const oldData: Record<string, unknown> = { status: org.status, planId: org.planId, name: org.name }

    // Suspend / activate
    if (action === 'suspend') {
      await db.organization.update({ where: { id }, data: { status: 'SUSPENDED' } })
      // Kill all sessions for all members
      const members = await db.organizationMember.findMany({ where: { organizationId: id }, select: { userId: true } })
      if (members.length > 0) {
        await db.session.deleteMany({ where: { userId: { in: members.map((m) => m.userId) } } })
      }
      await auditLog({ organizationId: id, userId: ctx.user.id, action: 'ORG_SUSPENDED', entityType: 'Organization', entityId: id, oldData, newData: { status: 'SUSPENDED' } })
      return ok({ organization: { id, status: 'SUSPENDED' }, message: 'Organization suspended — all user sessions revoked' })
    }

    if (action === 'activate') {
      await db.organization.update({ where: { id }, data: { status: 'ACTIVE' } })
      await auditLog({ organizationId: id, userId: ctx.user.id, action: 'ORG_ACTIVATED', entityType: 'Organization', entityId: id, oldData, newData: { status: 'ACTIVE' } })
      return ok({ organization: { id, status: 'ACTIVE' }, message: 'Organization activated' })
    }

    // Assign plan
    if (planId !== undefined) {
      if (planId === null) {
        await db.organization.update({ where: { id }, data: { planId: null } })
        await auditLog({ organizationId: id, userId: ctx.user.id, action: 'ORG_PLAN_REMOVED', entityType: 'Organization', entityId: id, oldData, newData: { planId: null } })
        return ok({ organization: { id, planId: null }, message: 'Plan removed from organization' })
      }

      const plan = await db.plan.findUnique({ where: { id: planId } })
      if (!plan) return err('NOT_FOUND', 'Plan not found', 404)

      await db.organization.update({ where: { id }, data: { planId } })
      await auditLog({ organizationId: id, userId: ctx.user.id, action: 'ORG_PLAN_ASSIGNED', entityType: 'Organization', entityId: id, oldData, newData: { planId, planName: plan.name } })
      return ok({ organization: { id, planId, planName: plan.name }, message: `Plan assigned: ${plan.name}` })
    }

    // Update name
    if (name !== undefined) {
      await db.organization.update({ where: { id }, data: { name } })
      await auditLog({ organizationId: id, userId: ctx.user.id, action: 'ORG_UPDATED', entityType: 'Organization', entityId: id, oldData, newData: { name } })
      return ok({ organization: { id, name }, message: 'Organization name updated' })
    }

    return err('VALIDATION_ERROR', 'No valid action specified', 400)
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}

// DELETE /api/v1/admin/organizations/:id — permanently delete an organization
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getSuperAdminContext()
    if (!ctx) return err('FORBIDDEN', 'Super admin access required', 403)

    const { id } = await params
    const org = await db.organization.findUnique({ where: { id } })
    if (!org) return err('NOT_FOUND', 'Organization not found', 404)

    await db.organization.delete({ where: { id } })

    await auditLog({
      organizationId: '',
      userId: ctx.user.id,
      action: 'ORG_DELETED',
      entityType: 'Organization',
      entityId: id,
      oldData: { name: org.name, slug: org.slug },
    })

    return ok({ deleted: true, id })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
