import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getSuperAdminContext } from '@/lib/super-admin'
import { NextRequest } from 'next/server'

// GET /api/v1/admin/activity
// Returns platform-wide activity: audit logs, active sessions, login history
export async function GET(req: NextRequest) {
  try {
    const ctx = await getSuperAdminContext()
    if (!ctx) return err('FORBIDDEN', 'Super admin access required', 403)

    const filter = req.nextUrl.searchParams.get('filter') || 'all'
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100')

    // Build where clause based on filter
    let where: Record<string, unknown> = {}
    if (filter === 'logins') where = { action: { in: ['LOGIN', 'LOGOUT', 'SIGNUP'] } }
    else if (filter === 'orders') where = { action: { in: ['ORDER_CONFIRMED', 'ORDER_CANCELLED', 'SHIPMENT_CREATED'] } }
    else if (filter === 'users') where = { entityType: 'User' }
    else if (filter === 'plans') where = { action: { contains: 'PLAN' } }
    else if (filter === 'orgs') where = { entityType: 'Organization' }

    const logs = await db.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        organization: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Active sessions with user info
    const activeSessions = await db.session.findMany({
      where: { expiresAt: { gt: new Date() } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isSuperAdmin: true,
            memberships: { include: { organization: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Summary stats
    const [
      totalLogins,
      totalSignups,
      totalOrderActions,
      totalShipments,
      totalPlanChanges,
      totalUserActions,
    ] = await Promise.all([
      db.auditLog.count({ where: { action: 'LOGIN' } }),
      db.auditLog.count({ where: { action: 'SIGNUP' } }),
      db.auditLog.count({ where: { action: { in: ['ORDER_CONFIRMED', 'ORDER_CANCELLED'] } } }),
      db.auditLog.count({ where: { action: 'SHIPMENT_CREATED' } }),
      db.auditLog.count({ where: { action: { contains: 'PLAN' } } }),
      db.auditLog.count({ where: { entityType: 'User' } }),
    ])

    return ok({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        user: l.user ? { name: l.user.name, email: l.user.email } : null,
        organization: l.organization ? { name: l.organization.name } : null,
        oldData: l.oldData ? JSON.parse(l.oldData) : null,
        newData: l.newData ? JSON.parse(l.newData) : null,
        createdAt: l.createdAt.toISOString(),
      })),
      activeSessions: activeSessions.map((s) => ({
        id: s.id,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        user: {
          id: s.user.id,
          name: s.user.name,
          email: s.user.email,
          isSuperAdmin: s.user.isSuperAdmin,
          organization: s.user.memberships[0]?.organization?.name || null,
        },
      })),
      summary: {
        totalLogins,
        totalSignups,
        totalOrderActions,
        totalShipments,
        totalPlanChanges,
        totalUserActions,
        activeSessionCount: activeSessions.length,
      },
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
