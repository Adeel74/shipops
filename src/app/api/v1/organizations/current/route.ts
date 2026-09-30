import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getAuthContext, auditLog } from '@/lib/auth'
import { NextRequest } from 'next/server'

// GET /api/v1/organizations/current
export async function GET() {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    return ok({
      organization: {
        id: ctx.organization.id,
        name: ctx.organization.name,
        slug: ctx.organization.slug,
        country: ctx.organization.country,
        timezone: ctx.organization.timezone,
        currency: ctx.organization.currency,
      },
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}

// PATCH /api/v1/organizations/current
// Update organization settings
export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    if (ctx.role !== 'OWNER' && ctx.role !== 'ADMIN') {
      return err('FORBIDDEN', 'Only owners and admins can update settings', 403)
    }

    const body = await req.json().catch(() => ({}))
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) {
      if (body.name.length < 2) return err('VALIDATION_ERROR', 'Name must be at least 2 characters', 400)
      updateData.name = body.name
    }
    if (body.country !== undefined) updateData.country = body.country
    if (body.timezone !== undefined) updateData.timezone = body.timezone
    if (body.currency !== undefined) updateData.currency = body.currency

    const updated = await db.organization.update({
      where: { id: ctx.organization.id },
      data: updateData,
    })

    await auditLog({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      action: 'ORG_SETTINGS_UPDATED',
      entityType: 'Organization',
      entityId: ctx.organization.id,
      oldData: {
        name: ctx.organization.name,
        country: ctx.organization.country,
        timezone: ctx.organization.timezone,
        currency: ctx.organization.currency,
      },
      newData: updateData,
    })

    return ok({
      organization: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        country: updated.country,
        timezone: updated.timezone,
        currency: updated.currency,
      },
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
