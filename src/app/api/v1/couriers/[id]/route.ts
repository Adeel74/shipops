import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getAuthContext, auditLog } from '@/lib/auth'
import { NextRequest } from 'next/server'

// PATCH /api/v1/couriers/:id
// Update courier account (e.g. change status, update credentials)
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

    const courier = await db.courierAccount.findFirst({
      where: { id, organizationId: ctx.organization.id },
    })
    if (!courier) return err('NOT_FOUND', 'Courier account not found', 404)

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.accountName !== undefined) updateData.accountName = body.accountName
    if (body.accountNumber !== undefined) updateData.accountNumber = body.accountNumber
    if (body.apiKey !== undefined) updateData.apiKeyEncrypted = body.apiKey
    if (body.apiSecret !== undefined) updateData.apiSecretEncrypted = body.apiSecret

    const updated = await db.courierAccount.update({
      where: { id },
      data: updateData,
    })

    await auditLog({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      action: body.status === 'DISCONNECTED' ? 'COURIER_DISCONNECTED' : 'COURIER_UPDATED',
      entityType: 'CourierAccount',
      entityId: courier.id,
      oldData: { status: courier.status },
      newData: updateData,
    })

    return ok({
      courier: { id: updated.id, provider: updated.provider, status: updated.status },
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}

// DELETE /api/v1/couriers/:id — disconnect/remove courier
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    if (ctx.role !== 'OWNER' && ctx.role !== 'ADMIN') {
      return err('FORBIDDEN', 'Only owners and admins can remove couriers', 403)
    }

    const { id } = await params
    const courier = await db.courierAccount.findFirst({
      where: { id, organizationId: ctx.organization.id },
    })
    if (!courier) return err('NOT_FOUND', 'Courier account not found', 404)

    // Soft delete — set status to DISCONNECTED
    await db.courierAccount.update({
      where: { id },
      data: { status: 'DISCONNECTED', apiKeyEncrypted: null, apiSecretEncrypted: null },
    })

    await auditLog({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      action: 'COURIER_DISCONNECTED',
      entityType: 'CourierAccount',
      entityId: courier.id,
      oldData: { provider: courier.provider, accountName: courier.accountName },
    })

    return ok({ disconnected: true, id })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
