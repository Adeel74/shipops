import { ok, err } from '@/lib/api'
import { getAuthContext } from '@/lib/auth'

// GET /api/v1/auth/me
// Returns the current authenticated user + organization + role
export async function GET() {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Not authenticated', 401)

    return ok({
      user: {
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
      },
      organization: {
        id: ctx.organization.id,
        name: ctx.organization.name,
        slug: ctx.organization.slug,
        country: ctx.organization.country,
        timezone: ctx.organization.timezone,
        currency: ctx.organization.currency,
      },
      role: ctx.role,
      permissions: ctx.role === 'OWNER' ? ['*'] : (
        ctx.role === 'ADMIN' ? ['dashboard', 'orders', 'customers', 'shipments', 'whatsapp', 'couriers', 'automation', 'analytics', 'ai', 'settings', 'team'] :
        ctx.role === 'MANAGER' ? ['dashboard', 'orders', 'customers', 'shipments', 'whatsapp', 'couriers', 'automation', 'analytics', 'ai'] :
        ctx.role === 'OPERATOR' ? ['dashboard', 'orders', 'customers', 'shipments', 'whatsapp'] :
        ['dashboard', 'orders:read', 'customers:read', 'analytics:read']
      ),
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
