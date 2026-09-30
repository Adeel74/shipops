import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getAuthContext } from '@/lib/auth'

// GET /api/v1/whatsapp/conversations
// Returns WhatsApp conversations grouped by customer, with messages.
export async function GET() {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return err('UNAUTHORIZED', 'Authentication required', 401)

    const orgId = ctx.organization.id

    // Get all messages, grouped by customer
    const messages = await db.whatsAppMessage.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'asc' },
      take: 500,
    })

    // Group by customerId
    const convosMap: Record<string, typeof messages> = {}
    for (const msg of messages) {
      if (!convosMap[msg.customerId]) convosMap[msg.customerId] = []
      convosMap[msg.customerId].push(msg)
    }

    // Build conversation objects
    const conversations = await Promise.all(
      Object.entries(convosMap).map(async ([customerId, msgs]) => {
        const customer = await db.customer.findUnique({ where: { id: customerId } })
        if (!customer) return null

        const sortedMsgs = [...msgs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        const lastMsg = sortedMsgs[sortedMsgs.length - 1]
        const unread = msgs.filter((m) => m.direction === 'INBOUND' && m.status !== 'READ').length

        // Determine conversation status based on linked order
        const linkedOrder = msgs[0]?.orderId
          ? await db.order.findUnique({ where: { id: msgs[0].orderId }, select: { status: true, orderNumber: true } })
          : null

        let status = 'PENDING'
        if (linkedOrder) {
          if (linkedOrder.status === 'CONFIRMED') status = 'CONFIRMED'
          else if (linkedOrder.status === 'CANCELLED') status = 'CANCELLED'
          else if (msgs.some((m) => m.direction === 'INBOUND')) status = 'AWAITING_REPLY'
          else if (linkedOrder.status === 'DELIVERED') status = 'RESOLVED'
        }

        return {
          id: `wa_${customerId}`,
          customerId,
          customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
          customerPhone: customer.phone || '',
          orderNumber: linkedOrder?.orderNumber,
          lastMessage: lastMsg?.body || '',
          lastMessageTime: lastMsg?.createdAt.toISOString() || new Date().toISOString(),
          unread,
          status,
          messages: sortedMsgs.map((m) => ({
            id: m.id,
            direction: m.direction,
            body: m.body || '',
            timestamp: m.createdAt.toISOString(),
            status: m.status,
            isAutomated: m.isAutomated,
          })),
        }
      })
    )

    // Sort by last message time (most recent first)
    const sorted = conversations
      .filter(Boolean)
      .sort((a, b) => new Date(b!.lastMessageTime).getTime() - new Date(a!.lastMessageTime).getTime())

    return ok({ conversations: sorted, total: sorted.length })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
