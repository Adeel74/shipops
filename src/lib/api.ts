// ShipOps — API response helpers + auth-aware request handling

import { NextResponse, NextRequest } from 'next/server'
import type { Organization } from '@prisma/client'
import { getAuthContext, AuthError, type AuthContext } from '@/lib/auth'

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, { status })
}

export function err(code: string, message: string, status = 400) {
  return NextResponse.json<ApiError>(
    { success: false, error: { code, message } },
    { status }
  )
}

/**
 * Wrap an API handler with auth + error handling.
 * The handler receives the AuthContext as the first argument.
 */
export async function withAuth<T>(
  handler: (ctx: AuthContext, req: NextRequest) => Promise<NextResponse<ApiSuccess<T> | ApiError>>
): Promise<(req: NextRequest) => Promise<NextResponse>> {
  return async (req: NextRequest) => {
    try {
      const ctx = await getAuthContext()
      if (!ctx) {
        return err('UNAUTHORIZED', 'Authentication required', 401)
      }
      return await handler(ctx, req)
    } catch (e) {
      if (e instanceof AuthError) {
        return err(e.code, e.message, e.statusCode)
      }
      console.error('[API Error]', e)
      return err('INTERNAL_ERROR', (e as Error).message, 500)
    }
  }
}

/**
 * Wrap an API handler with permission check.
 */
export async function withPermission<T>(
  permission: string,
  handler: (ctx: AuthContext, req: NextRequest) => Promise<NextResponse<ApiSuccess<T> | ApiError>>
): Promise<(req: NextRequest) => Promise<NextResponse>> {
  return async (req: NextRequest) => {
    try {
      const ctx = await getAuthContext()
      if (!ctx) {
        return err('UNAUTHORIZED', 'Authentication required', 401)
      }
      // Check permission
      const { hasPermission } = await import('@/lib/auth')
      if (!hasPermission(ctx.role, permission)) {
        return err('FORBIDDEN', `Role ${ctx.role} cannot perform this action`, 403)
      }
      return await handler(ctx, req)
    } catch (e) {
      if (e instanceof AuthError) {
        return err(e.code, e.message, e.statusCode)
      }
      console.error('[API Error]', e)
      return err('INTERNAL_ERROR', (e as Error).message, 500)
    }
  }
}

// Legacy compat — used by older routes that haven't been migrated yet
export const DEMO_ORG_SLUG = 'demo-store-pk'

export async function getDemoOrg(): Promise<Organization | null> {
  return db.organization.findUnique({ where: { slug: DEMO_ORG_SLUG } })
}

export async function requireOrg(): Promise<Organization> {
  const ctx = await getAuthContext()
  if (ctx) return ctx.organization
  const org = await getDemoOrg()
  if (!org) throw new Error('Organization not found')
  return org
}

// Re-export db for convenience in route files
export { db } from '@/lib/db'
