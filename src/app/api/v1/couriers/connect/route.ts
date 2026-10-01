import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getAuthContext, auditLog } from '@/lib/auth'
import { NextRequest } from 'next/server'

// POST /api/v1/couriers/connect
// Connect a courier account (simulated — in production, calls courier OAuth/API)
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    if (ctx.role !== 'OWNER' && ctx.role !== 'ADMIN' && ctx.role !== 'MANAGER') {
      return err('FORBIDDEN', 'Insufficient permissions', 403)
    }

    const body = await req.json().catch(() => ({}))
    const { provider, accountName, accountNumber, apiKey, apiSecret } = body

    if (!provider) return err('VALIDATION_ERROR', 'provider is required', 400)

    const validProviders = ['TCS', 'LEOPARDS', 'M&P', 'TRAX', 'POSTEX', 'CALL_COURIER', 'RIDER']
    if (!validProviders.includes(provider)) {
      return err('VALIDATION_ERROR', `provider must be one of: ${validProviders.join(', ')}`, 400)
    }

    // Check if already connected
    const existing = await db.courierAccount.findFirst({
      where: { organizationId: ctx.organization.id, provider },
    })

    if (existing) {
      // Update existing
      const updated = await db.courierAccount.update({
        where: { id: existing.id },
        data: {
          accountName: accountName || existing.accountName,
          accountNumber: accountNumber || existing.accountNumber,
          apiKeyEncrypted: apiKey || existing.apiKeyEncrypted,
          apiSecretEncrypted: apiSecret || existing.apiSecretEncrypted,
          status: 'ACTIVE',
        },
      })
      await auditLog({
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: 'COURIER_UPDATED',
        entityType: 'CourierAccount',
        entityId: updated.id,
        newData: { provider, accountName: updated.accountName },
      })
      return ok({ courier: { id: updated.id, provider: updated.provider, status: 'ACTIVE' }, connected: true })
    }

    // Create new
    const courier = await db.courierAccount.create({
      data: {
        organizationId: ctx.organization.id,
        provider,
        accountName: accountName || `${provider} Account`,
        accountNumber: accountNumber || null,
        apiKeyEncrypted: apiKey || null,
        apiSecretEncrypted: apiSecret || null,
        status: 'ACTIVE',
      },
    })

    await auditLog({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      action: 'COURIER_CONNECTED',
      entityType: 'CourierAccount',
      entityId: courier.id,
      newData: { provider, accountName: courier.accountName },
    })

    return ok({
      courier: { id: courier.id, provider: courier.provider, status: 'ACTIVE' },
      connected: true,
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
