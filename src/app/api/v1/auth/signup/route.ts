import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { setSessionCookie, auditLog } from '@/lib/auth'
import { signupSchema, parseBody } from '@/lib/validations'
import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'

// POST /api/v1/auth/signup
// Creates: User + Organization + OrganizationMember (OWNER role) + Session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = parseBody(signupSchema, body)
    if (!parsed.success) return err('VALIDATION_ERROR', parsed.error, 400)

    const { name, email, password, organizationName } = parsed.data

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) return err('CONFLICT', 'An account with this email already exists', 409)

    const passwordHash = createHash('sha256').update(password + 'shipops-salt').digest('hex')
    const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + randomBytes(2).toString('hex')

    const user = await db.user.create({ data: { name, email: email.toLowerCase(), passwordHash } })
    const org = await db.organization.create({ data: { name: organizationName, slug, country: 'Pakistan', timezone: 'Asia/Karachi', currency: 'PKR' } })
    const membership = await db.organizationMember.create({ data: { organizationId: org.id, userId: user.id, role: 'OWNER' } })

    // Create session
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    await db.session.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    })

    await setSessionCookie(token)

    // Audit log
    await auditLog({
      organizationId: org.id,
      userId: user.id,
      action: 'SIGNUP',
      entityType: 'Organization',
      entityId: org.id,
      newData: { name: org.name, slug: org.slug, role: 'OWNER' },
    })

    return ok({
      user: { id: user.id, name: user.name, email: user.email },
      role: 'OWNER',
      organization: { id: org.id, name: org.name, slug: org.slug },
      token,
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
