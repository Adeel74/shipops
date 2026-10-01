import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getSuperAdminContext } from '@/lib/super-admin'

// GET /api/v1/admin/system
// System health and audit logs for the entire platform
export async function GET() {
  try {
    const ctx = await getSuperAdminContext()
    if (!ctx) return err('FORBIDDEN', 'Super admin access required', 403)

    // Database stats
    const dbStart = Date.now()
    const tableCounts = await Promise.all([
      db.user.count(),
      db.organization.count(),
      db.order.count(),
      db.customer.count(),
      db.product.count(),
      db.shipment.count(),
      db.whatsAppMessage.count(),
      db.attentionCase.count(),
      db.automationRule.count(),
      db.auditLog.count(),
      db.session.count(),
      db.evidenceItem.count(),
      db.trackingEvent.count(),
      db.courierAccount.count(),
      db.store.count(),
    ])
    const dbLatency = Date.now() - dbStart

    const tableNames = [
      'users', 'organizations', 'orders', 'customers', 'products',
      'shipments', 'whatsapp_messages', 'attention_cases', 'automation_rules',
      'audit_logs', 'sessions', 'evidence_items', 'tracking_events',
      'courier_accounts', 'stores',
    ]
    const tables = tableNames.map((name, i) => ({ name, count: tableCounts[i] }))

    // Recent audit logs (platform-wide)
    const recentLogs = await db.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true } },
        organization: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })

    // Active sessions
    const activeSessions = await db.session.count({
      where: { expiresAt: { gt: new Date() } },
    })

    // Recent signups (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentUsers = await db.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      include: { memberships: { include: { organization: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return ok({
      health: {
        status: 'healthy',
        database: {
          connected: true,
          latencyMs: dbLatency,
        },
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      tables,
      activeSessions,
      recentAuditLogs: recentLogs.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        user: l.user ? { name: l.user.name, email: l.user.email } : null,
        organization: l.organization ? { name: l.organization.name } : null,
        createdAt: l.createdAt.toISOString(),
      })),
      recentSignups: recentUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        isSuperAdmin: u.isSuperAdmin,
        createdAt: u.createdAt.toISOString(),
        organization: u.memberships[0]?.organization?.name || null,
      })),
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
