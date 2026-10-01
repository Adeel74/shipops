import { db } from '@/lib/db'

// Shared Shopify order processor — used by both the webhook handler
// and the simulate-order endpoint.

interface ShopifyOrderPayload {
  id: number
  order_number: number
  total_price: string
  total_shipping_price_set?: { shop_money: { amount: string } }
  total_tax?: string
  total_discounts?: string
  payment_gateway_names?: string[]
  customer?: { id?: number; first_name?: string; last_name?: string; phone?: string; email?: string }
  shipping_address?: { address1?: string; city?: string; phone?: string; zip?: string; province?: string; country?: string }
  line_items?: { id: number; title: string; sku?: string; quantity: number; price: string; product_id?: number }[]
}

export async function processShopifyOrder(
  store: { id: string; organizationId: string },
  payload: ShopifyOrderPayload
) {
  // Idempotency check
  const existing = await db.order.findUnique({
    where: { storeId_shopifyOrderId: { storeId: store.id, shopifyOrderId: String(payload.id) } },
  })
  if (existing) return existing

  // Detect COD
  const isCod = (payload.payment_gateway_names || []).some(
    (p) => p.toLowerCase().includes('cod') || p.toLowerCase().includes('cash')
  )

  // Upsert customer by phone
  const customerPhone = payload.customer?.phone || payload.shipping_address?.phone || ''
  let customer = customerPhone
    ? await db.customer.findFirst({ where: { organizationId: store.organizationId, phone: customerPhone } })
    : null

  if (!customer) {
    customer = await db.customer.create({
      data: {
        organizationId: store.organizationId,
        shopifyCustomerId: payload.customer?.id ? String(payload.customer.id) : null,
        firstName: payload.customer?.first_name || '',
        lastName: payload.customer?.last_name || '',
        phone: customerPhone,
        email: payload.customer?.email || null,
        riskLevel: 'LOW',
        riskScore: 0,
      },
    })
  }

  // Create address
  if (payload.shipping_address) {
    await db.address.create({
      data: {
        customerId: customer.id,
        addressLine1: payload.shipping_address.address1 || null,
        city: payload.shipping_address.city || null,
        state: payload.shipping_address.province || null,
        postalCode: payload.shipping_address.zip || null,
        country: payload.shipping_address.country || 'Pakistan',
        phone: payload.shipping_address.phone || null,
        isDefault: true,
      },
    })
  }

  // Calculate amounts
  const totalAmount = parseFloat(payload.total_price) || 0
  const shippingFee = parseFloat(payload.total_shipping_price_set?.shop_money.amount || '0') || 0
  const tax = parseFloat(payload.total_tax || '0') || 0
  const discount = parseFloat(payload.total_discounts || '0') || 0

  // Create order
  const order = await db.order.create({
    data: {
      organizationId: store.organizationId,
      storeId: store.id,
      customerId: customer.id,
      shopifyOrderId: String(payload.id),
      orderNumber: `#${payload.order_number}`,
      isCod,
      paymentMethod: isCod ? 'COD' : 'PREPAID',
      subtotal: totalAmount - shippingFee - tax + discount,
      shippingFee,
      discount,
      tax,
      totalAmount,
      currency: 'PKR',
      status: 'UNCONFIRMED',
      riskScore: 0,
      riskLevel: 'LOW',
    },
  })

  // Create order items
  if (payload.line_items) {
    for (const item of payload.line_items) {
      await db.orderItem.create({
        data: {
          orderId: order.id,
          title: item.title,
          sku: item.sku || null,
          quantity: item.quantity,
          unitPrice: parseFloat(item.price) || 0,
          totalPrice: (parseFloat(item.price) || 0) * item.quantity,
        },
      })
    }
  }

  // Status history
  await db.orderStatusHistory.create({
    data: {
      orderId: order.id,
      newStatus: 'UNCONFIRMED',
      source: 'SHOPIFY_WEBHOOK',
    },
  })

  // Update customer order count
  await db.customer.update({
    where: { id: customer.id },
    data: { totalOrders: { increment: 1 } },
  })

  // Trigger automation: send WhatsApp confirmation for COD orders
  if (isCod) {
    await triggerWhatsAppConfirmation(order.id, customer.id, store.organizationId)
  }

  return order
}

// Send WhatsApp confirmation message (simulated)
async function triggerWhatsAppConfirmation(orderId: string, customerId: string, organizationId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, customer: true },
  })
  if (!order) return

  const message = `Assalam o Alaikum ${order.customer.firstName}! Aap ka order ${order.orderNumber} (${order.items[0]?.title || 'COD'}) COD Rs ${order.totalAmount.toLocaleString()}. Confirm karne ke liye reply CONFIRM ya CANCEL.`

  // Store the outbound message
  await db.whatsAppMessage.create({
    data: {
      organizationId,
      customerId,
      orderId,
      direction: 'OUTBOUND',
      status: 'SENT',
      messageType: 'text',
      body: message,
      isAutomated: true,
      sentAt: new Date(),
    },
  })

  console.log(`[Automation] WhatsApp confirmation sent for order ${order.orderNumber}`)
}

export async function updateShopifyOrder(
  store: { id: string; organizationId: string },
  payload: { id: number; financial_status?: string; fulfillment_status?: string }
) {
  const order = await db.order.findFirst({
    where: { storeId: store.id, shopifyOrderId: String(payload.id) },
  })
  if (!order) return

  if (payload.fulfillment_status === 'fulfilled' && order.status !== 'DELIVERED') {
    const oldStatus = order.status
    await db.order.update({ where: { id: order.id }, data: { status: 'DELIVERED' } })
    await db.orderStatusHistory.create({
      data: { orderId: order.id, oldStatus, newStatus: 'DELIVERED', source: 'SHOPIFY_WEBHOOK' },
    })
    await db.customer.update({
      where: { id: order.customerId },
      data: { deliveredOrders: { increment: 1 } },
    })
  }
}
