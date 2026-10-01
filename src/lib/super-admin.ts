// ShipOps — Super Admin authentication helpers
// Super admins have platform-wide access across all organizations.

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'
import type { User } from '@prisma/client'

export interface SuperAdminContext {
  user: User
}

/**
 * Get the super admin context from the session cookie.
 * Returns null if the user is not authenticated or not a super admin.
 */
export async function getSuperAdminContext(): Promise<SuperAdminContext | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('shipops_session')?.value

  if (!sessionToken) return null

  const tokenHash = createHash('sha256').update(sessionToken).digest('hex')
  const session = await db.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!session || session.expiresAt <= new Date()) return null
  if (!session.user.isSuperAdmin) return null

  return { user: session.user }
}

/**
 * Require super admin access — returns error response if not authorized.
 */
export async function requireSuperAdmin(): Promise<SuperAdminContext | null> {
  return getSuperAdminContext()
}
