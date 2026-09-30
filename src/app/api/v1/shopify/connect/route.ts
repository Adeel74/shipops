import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'

// POST /api/v1/shopify/connect
// Simulates the Shopify OAuth flow. In production, this would redirect to
// Shopify's OAuth URL and handle the callback at /api/v1/shopify/callback.
//
// For this demo: we directly connect a store with the given shop domain.
export async function POST(req: NextRequest) {
  try {
    const org = await requireOrg()
    const { shopDomain, accessToken } = await req.json()

    if (!shopDomain) return err('VALIDATION_ERROR', 'shopDomain is required', 400)

    // Normalize shop domain
    const normalized = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!normalized.endsWith('.myshopify.com')) {
      return err('VALIDATION_ERROR', 'Shop domain must end with .myshopify.com', 400)
    }

    // Check if store already exists
    const existing = await db.store.findUnique({ where: { shopDomain: normalized } })
    if (existing) {
      // Update existing store
      const updated = await db.store.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIVE',
          accessTokenEncrypted: accessToken || `shpat_demo_${Date.now()}`,
          name: org.name,
        },
      })
      return ok({ store: { id: updated.id, shopDomain: updated.shopDomain, status: updated.status }, connected: true })
    }

    // Create new store
    const store = await db.store.create({
      data: {
        organizationId: org.id,
        platform: 'SHOPIFY',
        name: org.name,
        shopDomain: normalized,
        accessTokenEncrypted: accessToken || `shpat_demo_${Date.now()}`,
        status: 'ACTIVE',
      },
    })

    // Register webhooks (simulated — in production, call Shopify Admin API)
    const webhooks = [
      'orders/create',
      'orders/updated',
      'orders/fulfilled',
      'app/uninstalled',
    ]

    return ok({
      store: { id: store.id, shopDomain: store.shopDomain, status: store.status },
      connected: true,
      webhooksRegistered: webhooks,
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}

// GET /api/v1/shopify/connect — returns connection status
export async function GET() {
  try {
    const org = await requireOrg()
    const stores = await db.store.findMany({ where: { organizationId: org.id } })
    return ok({
      stores: stores.map((s) => ({
        id: s.id,
        shopDomain: s.shopDomain,
        name: s.name,
        status: s.status,
        platform: s.platform,
        connectedAt: s.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
