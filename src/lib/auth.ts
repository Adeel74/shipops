// ShipOps — Session-based authentication & RBAC
//
// This module provides:
// - Session token verification from cookies
// - getCurrentUser() / getCurrentOrg() / requireAuth() / requireRole()
// - Audit logging helpers
//
// In production, sessions are stored as httpOnly cookies set at login.
// For this demo, we fall back to the demo org if no session is present.

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'
import type { User, Organization, OrganizationMember } from '@prisma/client'

export interface AuthContext {
  user: User
  organization: Organization
  membership: OrganizationMember
  role: string
}

// Permission definitions per role
export const PERMISSIONS: Record<string, string[]> = {
  OWNER: ['*'], // all permissions
  ADMIN: ['dashboard', 'orders', 'customers', 'shipments', 'whatsapp', 'couriers', 'automation', 'analytics', 'ai', 'settings', 'team', 'billing:read'],
  MANAGER: ['dashboard', 'orders', 'customers', 'shipments', 'whatsapp', 'couriers', 'automation', 'analytics', 'ai'],
  OPERATOR: ['dashboard', 'orders', 'customers', 'shipments', 'whatsapp'],
  VIEWER: ['dashboard', 'orders:read', 'customers:read', 'analytics:read'],
}

export function hasPermission(role: string, permission: string): boolean {
  const perms = PERMISSIONS[role] || []
  if (perms.includes('*')) return true
  // Check exact match or wildcard prefix (e.g., 'orders' matches 'orders:read')
  return perms.some((p) => p === permission || p === permission.split(':')[0])
}

/**
 * Get the current auth context from the session cookie.
 * Falls back to the demo org's owner if no session is present (for dev).
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('shipops_session')?.value

  if (sessionToken) {
    // Verify session token
    const tokenHash = createHash('sha256').update(sessionToken).digest('hex')
    const session = await db.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            memberships: { include: { organization: true } },
          },
        },
      },
    })

    if (session && session.expiresAt > new Date()) {
      const membership = session.user.memberships[0]
      if (membership) {
        return {
          user: session.user,
          organization: membership.organization,
          membership,
          role: membership.role,
        }
      }
    }
  }

  // Dev fallback: return the demo org's owner
  const org = await db.organization.findUnique({
    where: { slug: 'demo-store-pk' },
    include: {
      members: { where: { role: 'OWNER' }, include: { user: true }, take: 1 },
    },
  })

  if (!org || org.members.length === 0) return null

  const membership = org.members[0]
  return {
    user: membership.user,
    organization: org,
    membership,
    role: membership.role,
  }
}

/**
 * Require authentication — throws if no auth context.
 */
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext()
  if (!ctx) throw new AuthError('UNAUTHORIZED', 'Authentication required', 401)
  return ctx
}

/**
 * Require a specific permission.
 */
export async function requirePermission(permission: string): Promise<AuthContext> {
  const ctx = await requireAuth()
  if (!hasPermission(ctx.role, permission)) {
    throw new AuthError('FORBIDDEN', `Role ${ctx.role} cannot perform ${permission}`, 403)
  }
  return ctx
}

/**
 * Set session cookie (called at login).
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('shipops_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
}

/**
 * Clear session cookie (called at logout).
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('shipops_session')
}

// Custom error class for auth errors
export class AuthError extends Error {
  code: string
  statusCode: number
  constructor(code: string, message: string, statusCode: number) {
    super(message)
    this.code = code
    this.statusCode = statusCode
  }
}

// ============================================================
// Audit logging
// ============================================================

export async function auditLog(params: {
  organizationId: string
  userId?: string
  action: string
  entityType: string
  entityId?: string
  oldData?: unknown
  newData?: unknown
  ipAddress?: string
  userAgent?: string
}) {
  try {
    await db.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        oldData: params.oldData ? JSON.stringify(params.oldData) : null,
        newData: params.newData ? JSON.stringify(params.newData) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    })
  } catch (e) {
    console.error('[AuditLog] Failed to log:', e)
  }
}
