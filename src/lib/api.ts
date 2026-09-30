// ShipOps — API helper utilities
// Provides consistent response shapes and org-scoped queries.

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import type { Organization } from '@prisma/client'

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

// Demo org — in production, derive from authenticated session.
export const DEMO_ORG_SLUG = 'demo-store-pk'

export async function getDemoOrg(): Promise<Organization | null> {
  return db.organization.findUnique({ where: { slug: DEMO_ORG_SLUG } })
}

export async function requireOrg() {
  const org = await getDemoOrg()
  if (!org) throw new Error('Organization not found')
  return org
}
