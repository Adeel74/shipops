import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'

// GET /api/webhooks/whatsapp — webhook verification (Meta requirement)
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode')
  const token = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')

  // In production: verify token matches your WHATSAPP_VERIFY_TOKEN
  if (mode === 'subscribe' /* && token === process.env.WHATSAPP_VERIFY_TOKEN */) {
    return new Response(challenge, { status: 200 })
  }
  return err('FORBIDDEN', 'Invalid verification', 403)
}

// POST /api/webhooks/whatsapp — incoming messages & status updates
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let rawBody = ''
  try {
    rawBody = await req.text()
    const body = JSON.parse(rawBody)

    // Log webhook delivery
    let deliveryId: string | null = null
    try {
      const delivery = await db.webhookDelivery.create({
        data: { source: 'WHATSAPP', eventType: 'message', payload: rawBody.slice(0, 10000), processed: false },
      })
      deliveryId = delivery.id
    } catch {}

    // Meta sends an array of entry objects
    const entries = body?.entry || []
    for (const entry of entries) {
      const changes = entry?.changes || []
      for (const change of changes) {
        const value = change?.value
        if (!value) continue

        // Handle incoming message
        if (value.messages) {
          for (const msg of value.messages) {
            await processIncomingMessage(msg, value.metadata?.phone_number_id)
          }
        }

        // Handle status update (sent, delivered, read)
        if (value.statuses) {
          for (const status of value.statuses) {
            await processStatusUpdate(status)
          }
        }
      }
    }

    // Mark delivery as processed
    if (deliveryId) {
      await db.webhookDelivery.update({
        where: { id: deliveryId },
        data: { processed: true, processedAt: new Date(), processingTime: Date.now() - startTime },
      }).catch(() => {})
    }

    return ok({ received: true })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}

async function processIncomingMessage(msg: {
  from: string
  id: string
  type: string
  text?: { body: string }
  timestamp: string
}, phoneNumberId?: string) {
  const phone = msg.from
  const text = msg.type === 'text' ? msg.text?.body || '' : ''

  if (!text) return

  // Find customer by phone
  const customer = await db.customer.findFirst({ where: { phone: { contains: phone.slice(-10) } } })
  if (!customer) {
    console.log(`[WhatsApp] Message from unknown number: ${phone}`)
    return
  }

  // Find unconfirmed order for this customer
  const order = await db.order.findFirst({
    where: { customerId: customer.id, status: 'UNCONFIRMED' },
  })

  // Store the message
  await db.whatsAppMessage.create({
    data: {
      organizationId: customer.organizationId,
      customerId: customer.id,
      orderId: order?.id || null,
      direction: 'INBOUND',
      status: 'DELIVERED',
      messageType: msg.type,
      body: text,
      isAutomated: false,
      externalMessageId: msg.id,
      sentAt: new Date(parseInt(msg.timestamp) * 1000),
      deliveredAt: new Date(parseInt(msg.timestamp) * 1000),
    },
  })

  // Check for CONFIRM or CANCEL reply (automation rule)
  const upperText = text.trim().toUpperCase()
  if (order) {
    if (upperText === 'CONFIRM' || upperText === '1' || upperText.includes('CONFIRM')) {
      // Auto-confirm the order
      const oldStatus = order.status
      await db.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED', confirmationMethod: 'WHATSAPP', confirmedAt: new Date() },
      })
      await db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          oldStatus,
          newStatus: 'CONFIRMED',
          reason: 'Customer replied CONFIRM on WhatsApp',
          source: 'AUTOMATION',
        },
      })
      console.log(`[Automation] Order ${order.orderNumber} auto-confirmed via WhatsApp`)
    } else if (upperText === 'CANCEL' || upperText === '2' || upperText.includes('CANCEL')) {
      // Auto-cancel the order
      const oldStatus = order.status
      await db.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      })
      await db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          oldStatus,
          newStatus: 'CANCELLED',
          reason: 'Customer replied CANCEL on WhatsApp',
          source: 'AUTOMATION',
        },
      })
      console.log(`[Automation] Order ${order.orderNumber} auto-cancelled via WhatsApp`)
    }
  }
}

async function processStatusUpdate(status: { id: string; status: string; timestamp: string }) {
  // Update message status (sent → delivered → read)
  const msg = await db.whatsAppMessage.findFirst({ where: { externalMessageId: status.id } })
  if (!msg) return

  const now = new Date(parseInt(status.timestamp) * 1000)
  if (status.status === 'sent' && !msg.sentAt) {
    await db.whatsAppMessage.update({ where: { id: msg.id }, data: { status: 'SENT', sentAt: now } })
  } else if (status.status === 'delivered') {
    await db.whatsAppMessage.update({ where: { id: msg.id }, data: { status: 'DELIVERED', deliveredAt: now } })
  } else if (status.status === 'read') {
    await db.whatsAppMessage.update({ where: { id: msg.id }, data: { status: 'READ', readAt: now } })
  }
}
