import { ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

// POST /api/webhooks/shopify
// Receives Shopify webhooks and logs every delivery for audit.
// Order processing is done inline to avoid heavy module imports that crash Turbopack.
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let rawBody = ''

  try {
    rawBody = await req.text()
  } catch {
    return err('VALIDATION_ERROR', 'Could not read request body', 400)
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody)
  } catch {
    return err('VALIDATION_ERROR', 'Invalid JSON', 400)
  }

  const topic = req.headers.get('x-shopify-topic') || 'unknown'
  const shopDomain = req.headers.get('x-shopify-shop-domain') || ''

  // Log webhook delivery
  let deliveryId: string | null = null
  try {
    const delivery = await db.webhookDelivery.create({
      data: {
        source: 'SHOPIFY',
        eventType: topic,
        payload: rawBody.slice(0, 10000),
        processed: false,
      },
    })
    deliveryId = delivery.id
  } catch {
    // Continue even if logging fails
  }

  try {
    if (!shopDomain) throw new Error('Missing shop domain')

    const store = await db.store.findUnique({ where: { shopDomain } })
    if (!store) throw new Error('Store not connected')

    // Only handle orders/create — other topics just log
    if (topic === 'orders/create') {
      // Inline order processing (simplified version of shopify-processor)
      const orderId = String(body.id || '')
      const existing = await db.order.findUnique({
        where: { storeId_shopifyOrderId: { storeId: store.id, shopifyOrderId: orderId } },
      })
      if (!existing) {
        const paymentGateways = (body.payment_gateway_names || []) as string[]
        const isCod = paymentGateways.some((p) => p.toLowerCase().includes('cod') || p.toLowerCase().includes('cash'))

        const customerData = body.customer as Record<string, unknown> | undefined
        const shipAddr = body.shipping_address as Record<string, unknown> | undefined
        const customerPhone = (customerData?.phone as string) || (shipAddr?.phone as string) || ''

        let customer = customerPhone
          ? await db.customer.findFirst({ where: { organizationId: store.organizationId, phone: customerPhone } })
          : null

        if (!customer) {
          customer = await db.customer.create({
            data: {
              organizationId: store.organizationId,
              shopifyCustomerId: customerData?.id ? String(customerData.id) : null,
              firstName: (customerData?.first_name as string) || '',
              lastName: (customerData?.last_name as string) || '',
              phone: customerPhone,
              email: (customerData?.email as string) || null,
              riskLevel: 'LOW',
              riskScore: 0,
            },
          })
        }

        if (shipAddr) {
          await db.address.create({
            data: {
              customerId: customer.id,
              addressLine1: (shipAddr.address1 as string) || null,
              city: (shipAddr.city as string) || null,
              country: (shipAddr.country as string) || 'Pakistan',
              phone: (shipAddr.phone as string) || null,
              isDefault: true,
            },
          })
        }

        const totalAmount = parseFloat(String(body.total_price || '0')) || 0
        const orderNumber = `#${body.order_number || ''}`

        const order = await db.order.create({
          data: {
            organizationId: store.organizationId,
            storeId: store.id,
            customerId: customer.id,
            shopifyOrderId: orderId,
            orderNumber,
            isCod,
            paymentMethod: isCod ? 'COD' : 'PREPAID',
            subtotal: totalAmount,
            shippingFee: 200,
            totalAmount,
            currency: 'PKR',
            status: 'UNCONFIRMED',
            riskScore: 0,
            riskLevel: 'LOW',
          },
        })

        const lineItems = (body.line_items || []) as Array<Record<string, unknown>>
        for (const item of lineItems) {
          await db.orderItem.create({
            data: {
              orderId: order.id,
              title: (item.title as string) || '',
              sku: (item.sku as string) || null,
              quantity: (item.quantity as number) || 1,
              unitPrice: parseFloat(String(item.price || '0')) || 0,
              totalPrice: (parseFloat(String(item.price || '0')) || 0) * ((item.quantity as number) || 1),
            },
          })
        }

        await db.orderStatusHistory.create({
          data: { orderId: order.id, newStatus: 'UNCONFIRMED', source: 'SHOPIFY_WEBHOOK' },
        })

        await db.customer.update({
          where: { id: customer.id },
          data: { totalOrders: { increment: 1 } },
        })
      }
    } else if (topic === 'app/uninstalled') {
      await db.store.update({ where: { id: store.id }, data: { status: 'DISCONNECTED', accessTokenEncrypted: null } })
    }

    // Mark as processed
    if (deliveryId) {
      await db.webhookDelivery.update({
        where: { id: deliveryId },
        data: { processed: true, processedAt: new Date(), processingTime: Date.now() - startTime },
      }).catch(() => {})
    }

    return ok({ received: true, topic, processed: true })
  } catch (processError) {
    if (deliveryId) {
      await db.webhookDelivery.update({
        where: { id: deliveryId },
        data: { processed: false, error: (processError as Error).message, processedAt: new Date(), processingTime: Date.now() - startTime },
      }).catch(() => {})
    }
    return err('PROCESSING_ERROR', (processError as Error).message, 500)
  }
}

// GET /api/webhooks/shopify — verification endpoint
export async function GET() {
  return ok({ status: 'ok', message: 'ShipOps Shopify webhook receiver is active' })
}
