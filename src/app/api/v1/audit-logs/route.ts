import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getAuthContext } from '@/lib/auth'
import { NextRequest } from 'next/server'

// GET /api/v1/audit-logs
// Returns audit log entries for the organization.
export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
    const action = req.nextUrl.searchParams.get('action')

    const logs = await db.auditLog.findMany({
      where: {
        organizationId: ctx.organization.id,
        ...(action ? { action } : {}),
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return ok({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        user: l.user ? { name: l.user.name, email: l.user.email } : null,
        oldData: l.oldData ? JSON.parse(l.oldData) : null,
        newData: l.newData ? JSON.parse(l.newData) : null,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
      })),
      total: logs.length,
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
