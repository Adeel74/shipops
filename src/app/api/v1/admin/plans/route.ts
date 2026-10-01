import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getSuperAdminContext } from '@/lib/super-admin'
import { auditLog } from '@/lib/auth'
import { NextRequest } from 'next/server'

// GET /api/v1/admin/plans — list all plans
export async function GET() {
  try {
    const ctx = await getSuperAdminContext()
    if (!ctx) return err('FORBIDDEN', 'Super admin access required', 403)

    const plans = await db.plan.findMany({
      include: { _count: { select: { organizations: true } } },
      orderBy: { pricePerMonth: 'asc' },
    })

    return ok({
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        pricePerMonth: p.pricePerMonth,
        orderLimit: p.orderLimit,
        memberLimit: p.memberLimit,
        courierLimit: p.courierLimit,
        features: JSON.parse(p.features),
        isActive: p.isActive,
        organizationCount: p._count.organizations,
        createdAt: p.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}

// POST /api/v1/admin/plans — create a new plan
export async function POST(req: NextRequest) {
  try {
    const ctx = await getSuperAdminContext()
    if (!ctx) return err('FORBIDDEN', 'Super admin access required', 403)

    const body = await req.json()
    const { name, description, pricePerMonth, orderLimit, memberLimit, courierLimit, features } = body

    if (!name || pricePerMonth === undefined) return err('VALIDATION_ERROR', 'name and pricePerMonth required', 400)

    const plan = await db.plan.create({
      data: {
        name,
        description: description || null,
        pricePerMonth: parseFloat(pricePerMonth),
        orderLimit: orderLimit || 500,
        memberLimit: memberLimit || 3,
        courierLimit: courierLimit || 1,
        features: JSON.stringify(features || []),
        isActive: true,
      },
    })

    await auditLog({
      organizationId: '',
      userId: ctx.user.id,
      action: 'PLAN_CREATED',
      entityType: 'Plan',
      entityId: plan.id,
      newData: { name, pricePerMonth },
    })

    return ok({ plan: { id: plan.id, name: plan.name } })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
