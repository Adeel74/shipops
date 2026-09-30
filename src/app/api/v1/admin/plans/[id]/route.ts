import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getSuperAdminContext } from '@/lib/super-admin'
import { auditLog } from '@/lib/auth'
import { NextRequest } from 'next/server'

// PATCH /api/v1/admin/plans/:id — update a plan
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getSuperAdminContext()
    if (!ctx) return err('FORBIDDEN', 'Super admin access required', 403)

    const { id } = await params
    const body = await req.json()

    const plan = await db.plan.findUnique({ where: { id } })
    if (!plan) return err('NOT_FOUND', 'Plan not found', 404)

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.pricePerMonth !== undefined) updateData.pricePerMonth = parseFloat(body.pricePerMonth)
    if (body.orderLimit !== undefined) updateData.orderLimit = body.orderLimit
    if (body.memberLimit !== undefined) updateData.memberLimit = body.memberLimit
    if (body.courierLimit !== undefined) updateData.courierLimit = body.courierLimit
    if (body.features !== undefined) updateData.features = JSON.stringify(body.features)
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const updated = await db.plan.update({ where: { id }, data: updateData })

    await auditLog({
      organizationId: '',
      userId: ctx.user.id,
      action: 'PLAN_UPDATED',
      entityType: 'Plan',
      entityId: plan.id,
      oldData: { name: plan.name, price: plan.pricePerMonth },
      newData: updateData,
    })

    return ok({ plan: { id: updated.id, name: updated.name } })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}

// DELETE /api/v1/admin/plans/:id — delete a plan (only if no orgs assigned)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getSuperAdminContext()
    if (!ctx) return err('FORBIDDEN', 'Super admin access required', 403)

    const { id } = await params
    const plan = await db.plan.findUnique({
      where: { id },
      include: { _count: { select: { organizations: true } } },
    })
    if (!plan) return err('NOT_FOUND', 'Plan not found', 404)

    if (plan._count.organizations > 0) {
      return err('CONFLICT', `Cannot delete plan — ${plan._count.organizations} organization(s) are assigned. Reassign them first.`, 409)
    }

    await db.plan.delete({ where: { id } })

    await auditLog({
      organizationId: '',
      userId: ctx.user.id,
      action: 'PLAN_DELETED',
      entityType: 'Plan',
      entityId: plan.id,
      oldData: { name: plan.name },
    })

    return ok({ deleted: true, id })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
