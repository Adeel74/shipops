import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getSuperAdminContext } from '@/lib/super-admin'
import { auditLog } from '@/lib/auth'
import { NextRequest } from 'next/server'

// PATCH /api/v1/admin/users/:id
// Update user: change role in an org, suspend/activate, promote/demote super admin
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getSuperAdminContext()
    if (!ctx) return err('FORBIDDEN', 'Super admin access required', 403)

    const { id } = await params
    const body = await req.json()
    const { action, role, organizationId, isSuperAdmin } = body

    const user = await db.user.findUnique({
      where: { id },
      include: { memberships: true },
    })
    if (!user) return err('NOT_FOUND', 'User not found', 404)

    // Prevent self-suspension / self-demotion
    if (user.id === ctx.user.id && (action === 'suspend' || (isSuperAdmin !== undefined && !isSuperAdmin))) {
      return err('FORBIDDEN', 'You cannot suspend or demote yourself', 403)
    }

    const oldData = { status: user.status, isSuperAdmin: user.isSuperAdmin }

    // Handle different actions
    if (action === 'suspend') {
      await db.user.update({ where: { id }, data: { status: 'SUSPENDED' } })
      // Kill all sessions
      await db.session.deleteMany({ where: { userId: id } })
      await auditLog({ organizationId: '', userId: ctx.user.id, action: 'USER_SUSPENDED', entityType: 'User', entityId: id, oldData, newData: { status: 'SUSPENDED' } })
      return ok({ user: { id, status: 'SUSPENDED' }, message: 'User suspended — all sessions revoked' })
    }

    if (action === 'activate') {
      await db.user.update({ where: { id }, data: { status: 'ACTIVE' } })
      await auditLog({ organizationId: '', userId: ctx.user.id, action: 'USER_ACTIVATED', entityType: 'User', entityId: id, oldData, newData: { status: 'ACTIVE' } })
      return ok({ user: { id, status: 'ACTIVE' }, message: 'User activated' })
    }

    if (isSuperAdmin !== undefined) {
      await db.user.update({ where: { id }, data: { isSuperAdmin } })
      await auditLog({
        organizationId: '',
        userId: ctx.user.id,
        action: isSuperAdmin ? 'USER_PROMOTED_SUPERADMIN' : 'USER_DEMOTED_SUPERADMIN',
        entityType: 'User',
        entityId: id,
        oldData,
        newData: { isSuperAdmin },
      })
      return ok({ user: { id, isSuperAdmin }, message: isSuperAdmin ? 'Promoted to super admin' : 'Removed super admin' })
    }

    // Change role in an organization
    if (role && organizationId) {
      const membership = await db.organizationMember.findFirst({
        where: { userId: id, organizationId },
      })
      if (!membership) return err('NOT_FOUND', 'User is not a member of this organization', 404)

      const validRoles = ['OWNER', 'ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']
      if (!validRoles.includes(role)) return err('VALIDATION_ERROR', 'Invalid role', 400)

      await db.organizationMember.update({
        where: { id: membership.id },
        data: { role },
      })

      await auditLog({
        organizationId,
        userId: ctx.user.id,
        action: 'USER_ROLE_CHANGED',
        entityType: 'User',
        entityId: id,
        oldData: { role: membership.role },
        newData: { role },
      })

      return ok({ user: { id, role }, message: `Role changed to ${role}` })
    }

    return err('VALIDATION_ERROR', 'No valid action specified', 400)
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}

// DELETE /api/v1/admin/users/:id — permanently delete a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getSuperAdminContext()
    if (!ctx) return err('FORBIDDEN', 'Super admin access required', 403)

    const { id } = await params

    if (id === ctx.user.id) return err('FORBIDDEN', 'You cannot delete yourself', 403)

    const user = await db.user.findUnique({ where: { id } })
    if (!user) return err('NOT_FOUND', 'User not found', 404)

    // Delete sessions first
    await db.session.deleteMany({ where: { userId: id } })

    await db.user.delete({ where: { id } })

    await auditLog({
      organizationId: '',
      userId: ctx.user.id,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: id,
      oldData: { name: user.name, email: user.email },
    })

    return ok({ deleted: true, id })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
