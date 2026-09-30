import { ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'
import { processShopifyOrder, updateShopifyOrder } from '@/lib/shopify-processor'

// POST /api/webhooks/shopify
// Receives Shopify webhooks: orders/create, orders/updated, orders/fulfilled, app/uninstalled
//
// In production, verify the HMAC signature in the 'X-Shopify-Hmac-SHA256' header.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const body = JSON.parse(rawBody)

    const topic = req.headers.get('x-shopify-topic') || ''
    const shopDomain = req.headers.get('x-shopify-shop-domain') || ''
    const hmac = req.headers.get('x-shopify-hmac-sha256') || ''

    // Lightweight verification (in production: verify HMAC with SHOPIFY_API_SECRET)
    // const expectedHmac = createHmac('sha256', process.env.SHOPIFY_API_SECRET!).update(rawBody).digest('base64')
    // if (hmac !== expectedHmac) return err('UNAUTHORIZED', 'Invalid HMAC', 401)

    if (!shopDomain) return err('VALIDATION_ERROR', 'Missing shop domain', 400)

    const { db } = await import('@/lib/db')
    const store = await db.store.findUnique({ where: { shopDomain } })
    if (!store) return err('NOT_FOUND', 'Store not connected', 404)

    if (topic === 'orders/create') {
      await processShopifyOrder(store, body)
    } else if (topic === 'orders/updated' || topic === 'orders/fulfilled') {
      await updateShopifyOrder(store, body)
    } else if (topic === 'app/uninstalled') {
      await db.store.update({ where: { id: store.id }, data: { status: 'DISCONNECTED', accessTokenEncrypted: null } })
    }

    return ok({ received: true, topic, processed: true })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}

// GET /api/webhooks/shopify — verification endpoint
export async function GET() {
  return ok({ status: 'ok', message: 'ShipOps Shopify webhook receiver is active' })
}
