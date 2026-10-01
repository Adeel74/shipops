import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'

// POST /api/v1/whatsapp/send
// Send a WhatsApp message to a customer (simulated — in production, call Meta Cloud API)
export async function POST(req: NextRequest) {
  try {
    const org = await requireOrg()
    const { customerId, orderId, message } = await req.json()

    if (!customerId || !message) {
      return err('VALIDATION_ERROR', 'customerId and message are required', 400)
    }

    const customer = await db.customer.findFirst({ where: { id: customerId, organizationId: org.id } })
    if (!customer) return err('NOT_FOUND', 'Customer not found', 404)

    // Create the message record
    const msg = await db.whatsAppMessage.create({
      data: {
        organizationId: org.id,
        customerId,
        orderId: orderId || null,
        direction: 'OUTBOUND',
        status: 'SENT',
        messageType: 'text',
        body: message,
        isAutomated: false,
        sentAt: new Date(),
      },
    })

    // In production: call WhatsApp Cloud API here
    // POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
    // {
    //   messaging_product: 'whatsapp',
    //   to: customer.phone,
    //   type: 'text',
    //   text: { body: message }
    // }

    return ok({
      messageId: msg.id,
      status: 'SENT',
      to: customer.phone,
      message,
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
