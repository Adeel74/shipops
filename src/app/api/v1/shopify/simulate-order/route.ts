import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'

// POST /api/v1/shopify/simulate-order
// Simulates a Shopify order/create webhook — useful for testing the full
// webhook → order processing → automation pipeline without a real Shopify store.
export async function POST(req: NextRequest) {
  try {
    const org = await requireOrg()
    const body = await req.json().catch(() => ({}))

    // Get the first store for this org
    const store = await db.store.findFirst({ where: { organizationId: org.id, status: 'ACTIVE' } })
    if (!store) return err('NOT_FOUND', 'No connected store. Connect Shopify first.', 404)

    // Generate a simulated Shopify order payload
    const orderNumber = body.order_number || Math.floor(1000 + Math.random() * 9000)
    const shopifyOrderId = Math.floor(1000000000000 + Math.random() * 9000000000000)
    const customerName = body.customer_name || ['Ali', 'Sara', 'Hassan', 'Zainab', 'Omar'][Math.floor(Math.random() * 5)]
    const customerPhone = body.customer_phone || `03${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000000 + Math.random() * 8999999)}`
    const city = body.city || ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad', 'Multan'][Math.floor(Math.random() * 5)]
    const productTitle = body.product_title || ['Cotton Suit (3 Piece)', 'Men\'s Kameez Shalwar', 'Leather Sandals', 'Lawn Suit', 'Smartphone Case'][Math.floor(Math.random() * 5)]
    const price = body.price || Math.floor(1500 + Math.random() * 8500)
    const qty = body.qty || 1

    const simulatedPayload = {
      id: shopifyOrderId,
      order_number: orderNumber,
      total_price: (price * qty + 200).toFixed(2),
      total_shipping_price_set: { shop_money: { amount: '200.00' } },
      total_tax: '0.00',
      total_discounts: '0.00',
      payment_gateway_names: ['Cash on Delivery (COD)'],
      customer: {
        id: Math.floor(1000000000000 + Math.random() * 9000000000000),
        first_name: customerName,
        last_name: '',
        phone: customerPhone,
        email: `${customerName.toLowerCase()}@email.com`,
      },
      shipping_address: {
        address1: `${Math.floor(Math.random() * 200) + 1}, Block ${String.fromCharCode(65 + Math.floor(Math.random() * 10))}`,
        city,
        phone: customerPhone,
        zip: '',
        province: '',
        country: 'Pakistan',
      },
      line_items: [
        {
          id: Math.floor(Math.random() * 1000000000000),
          title: productTitle,
          sku: `SKU-${Math.floor(Math.random() * 9999)}`,
          quantity: qty,
          price: price.toFixed(2),
          product_id: Math.floor(Math.random() * 1000000000000),
        },
      ],
    }

    // Process as if it came from the webhook
    // (In production, this would come via POST /api/webhooks/shopify)
    const { processShopifyOrder } = await import('@/lib/shopify-processor')
    const order = await processShopifyOrder(store, simulatedPayload)

    return ok({
      simulated: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        isCod: order.isCod,
        customerPhone,
        city,
      },
      webhookPayload: simulatedPayload,
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
