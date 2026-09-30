import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'

// POST /api/v1/auth/signup
// Creates: User + Organization + OrganizationMember (OWNER role) + Session
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, organizationName } = await req.json()

    if (!name || !email || !password || !organizationName) {
      return err('VALIDATION_ERROR', 'All fields are required', 400)
    }
    if (password.length < 8) {
      return err('VALIDATION_ERROR', 'Password must be at least 8 characters', 400)
    }

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) return err('CONFLICT', 'An account with this email already exists', 409)

    const passwordHash = createHash('sha256').update(password + 'shipops-salt').digest('hex')

    const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + randomBytes(2).toString('hex')

    const user = await db.user.create({ data: { name, email: email.toLowerCase(), passwordHash } })
    const org = await db.organization.create({ data: { name: organizationName, slug, country: 'Pakistan', timezone: 'Asia/Karachi', currency: 'PKR' } })
    await db.organizationMember.create({ data: { organizationId: org.id, userId: user.id, role: 'OWNER' } })

    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    await db.session.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
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
