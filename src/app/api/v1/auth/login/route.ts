import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'

// POST /api/v1/auth/login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return err('VALIDATION_ERROR', 'Email and password are required', 400)

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user || !user.passwordHash) return err('UNAUTHORIZED', 'Invalid email or password', 401)

    const hash = createHash('sha256').update(password + 'shipops-salt').digest('hex')
    if (hash !== user.passwordHash) return err('UNAUTHORIZED', 'Invalid email or password', 401)

    // Create session
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    await db.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const membership = await db.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    })

    return ok({
      user: { id: user.id, name: user.name, email: user.email },
      role: membership?.role || 'VIEWER',
      organization: membership?.organization
        ? { id: membership.organization.id, name: membership.organization.name, slug: membership.organization.slug }
        : null,
      token,
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
