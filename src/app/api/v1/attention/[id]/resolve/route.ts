import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'

// POST /api/v1/attention/:id/resolve
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const org = await requireOrg()
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const resolution = body.resolution || 'Resolved by operator'

    const case_ = await db.attentionCase.findFirst({ where: { id, organizationId: org.id } })
    if (!case_) return err('NOT_FOUND', 'Case not found', 404)

    await db.attentionCase.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    })

    return ok({ caseId: case_.id, status: 'RESOLVED', resolution })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
