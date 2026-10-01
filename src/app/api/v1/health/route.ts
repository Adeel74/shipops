import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'

// GET /api/v1/health
// Returns system health status — used for monitoring and uptime checks
export async function GET() {
  try {
    // Test database connectivity
    const dbStart = Date.now()
    await db.user.count()
    const dbLatency = Date.now() - dbStart

    // Count records
    const [users, organizations, orders] = await Promise.all([
      db.user.count(),
      db.organization.count(),
      db.order.count(),
    ])

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: true,
        latencyMs: dbLatency,
      },
      stats: {
        users,
        organizations,
        orders,
      },
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    }

    return ok(health)
  } catch (e) {
    return err('HEALTH_CHECK_FAILED', (e as Error).message, 503)
  }
}
