import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getAuthContext, auditLog } from '@/lib/auth'
import { inviteMemberSchema, parseBody } from '@/lib/validations'
import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'

// POST /api/v1/team/invite
// Creates an invitation for a new team member.
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    // Only OWNER and ADMIN can invite
    if (ctx.role !== 'OWNER' && ctx.role !== 'ADMIN') {
      return err('FORBIDDEN', 'Only owners and admins can invite team members', 403)
    }

    const body = await req.json().catch(() => ({}))
    const parsed = parseBody(inviteMemberSchema, body)
    if (!parsed.success) return err('VALIDATION_ERROR', parsed.error, 400)

    const { email, role } = parsed.data

    // Check if email already has an account in this org
    const existingUser = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existingUser) {
      const existingMember = await db.organizationMember.findFirst({
        where: { userId: existingUser.id, organizationId: ctx.organization.id },
      })
      if (existingMember) return err('CONFLICT', 'This user is already a team member', 409)
    }

    // Check for existing pending invitation
    const existingInv = await db.organizationInvitation.findFirst({
      where: { organizationId: ctx.organization.id, email: email.toLowerCase(), acceptedAt: null },
    })
    if (existingInv) return err('CONFLICT', 'An invitation has already been sent to this email', 409)

    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')

    const invitation = await db.organizationInvitation.create({
      data: {
        organizationId: ctx.organization.id,
        email: email.toLowerCase(),
        role,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    await auditLog({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      action: 'TEAM_INVITE',
      entityType: 'OrganizationInvitation',
      entityId: invitation.id,
      newData: { email, role },
    })

    // In production, send email here. For dev, return the invite URL.
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/accept?token=${token}`

    // Send invitation email
    const { sendInvitationEmail } = await import('@/lib/email')
    await sendInvitationEmail({
      to: email.toLowerCase(),
      orgName: ctx.organization.name,
      inviterName: ctx.user.name,
      role,
      inviteUrl,
    })

    return ok({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
      },
      // Only return the URL in dev mode
      ...(process.env.NODE_ENV !== 'production' ? { inviteUrl } : {}),
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
