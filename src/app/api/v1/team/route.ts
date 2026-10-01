import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'

// GET /api/v1/team
export async function GET() {
  try {
    const org = await requireOrg()
    const memberships = await db.organizationMember.findMany({
      where: { organizationId: org.id },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    })

    const invitations = await db.organizationInvitation.findMany({
      where: { organizationId: org.id, acceptedAt: null },
    })

    const avatarColors = ['#0F766E', '#C2410C', '#6A4C93', '#1D3557', '#2A9D8F', '#8D99AE']
    const members = memberships.map((m, i) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      status: 'ACTIVE',
      lastActiveAt: new Date().toISOString(),
      avatarColor: avatarColors[i % avatarColors.length],
    }))

    // Add invitations as "INVITED" members
    for (const inv of invitations) {
      members.push({
        id: inv.id,
        name: inv.email.split('@')[0],
        email: inv.email,
        role: inv.role,
        status: 'INVITED',
        lastActiveAt: '',
        avatarColor: '#8D99AE',
      })
    }

    return ok({ members })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
