import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getSuperAdminContext } from '@/lib/super-admin'
import { NextRequest } from 'next/server'

// GET /api/v1/admin/users
// List all users across the platform
export async function GET(req: NextRequest) {
  try {
    const ctx = await getSuperAdminContext()
    if (!ctx) return err('FORBIDDEN', 'Super admin access required', 403)

    const search = req.nextUrl.searchParams.get('q') || ''
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100')

    const users = await db.user.findMany({
      where: search ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ]
      } : undefined,
      include: {
        memberships: {
          include: {
            organization: { select: { id: true, name: true, slug: true } },
          },
        },
        sessions: { select: { id: true, expiresAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return ok({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        isSuperAdmin: u.isSuperAdmin,
        status: u.status,
        createdAt: u.createdAt.toISOString(),
        memberships: u.memberships.map((m) => ({
          role: m.role,
          organization: m.organization,
        })),
        activeSessions: u.sessions.filter((s) => s.expiresAt > new Date()).length,
      })),
      total: users.length,
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
