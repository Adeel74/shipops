import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getAuthContext, auditLog } from '@/lib/auth'
import { NextRequest } from 'next/server'

// POST /api/v1/customers/:id/flag
// Flag or blacklist a customer (set risk level to HIGH, update risk score)
export async function POST(
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
    const { flag, reason } = body

    const customer = await db.customer.findFirst({
      where: { id, organizationId: ctx.organization.id },
    })
    if (!customer) return err('NOT_FOUND', 'Customer not found', 404)

    const oldData = { riskLevel: customer.riskLevel, riskScore: customer.riskScore }

    // flag=true = blacklist (HIGH risk), flag=false = unflag (reset to LOW)
    const updateData = flag
      ? { riskLevel: 'HIGH', riskScore: 95 }
      : { riskLevel: 'LOW', riskScore: 0 }

    const updated = await db.customer.update({
      where: { id },
      data: updateData,
    })

    await auditLog({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      action: flag ? 'CUSTOMER_BLACKLISTED' : 'CUSTOMER_UNFLAGGED',
      entityType: 'Customer',
      entityId: customer.id,
      oldData,
      newData: { ...updateData, reason: reason || null },
    })

    return ok({
      customer: {
        id: updated.id,
        name: `${updated.firstName} ${updated.lastName}`.trim(),
        riskLevel: updated.riskLevel,
        riskScore: updated.riskScore,
      },
      flagged: flag,
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
