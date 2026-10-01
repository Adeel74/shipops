import { ok, err } from '@/lib/api'
import { clearSessionCookie, getAuthContext } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

// POST /api/v1/auth/logout
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext()

    // Delete session from DB if we have a token
    const cookieStore = await import('next/headers').then((m) => m.cookies())
    const sessionToken = cookieStore.get('shipops_session')?.value
    if (sessionToken) {
      const tokenHash = createHash('sha256').update(sessionToken).digest('hex')
      await db.session.deleteMany({ where: { tokenHash } }).catch(() => {})
    }

    await clearSessionCookie()

    // Audit log
    if (ctx) {
      await db.auditLog.create({
        data: {
          organizationId: ctx.organization.id,
          userId: ctx.user.id,
          action: 'LOGOUT',
          entityType: 'User',
          entityId: ctx.user.id,
        },
      })
    }

    return ok({ loggedOut: true })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
