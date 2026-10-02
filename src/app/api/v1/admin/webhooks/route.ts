import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { getSuperAdminContext } from '@/lib/super-admin'
import { NextRequest } from 'next/server'

// GET /api/v1/admin/webhooks
// Returns webhook delivery log for the entire platform
export async function GET(req: NextRequest) {
  try {
    const ctx = await getSuperAdminContext()
    if (!ctx) return err('FORBIDDEN', 'Super admin access required', 403)

    const source = req.nextUrl.searchParams.get('source') || 'ALL'
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100')

    const deliveries = await db.webhookDelivery.findMany({
      where: source !== 'ALL' ? { source } : undefined,
      orderBy: { receivedAt: 'desc' },
      take: limit,
    })

    // Summary stats
    const [
      total,
      shopifyCount,
      whatsappCount,
      courierCount,
      processedCount,
      failedCount,
    ] = await Promise.all([
      db.webhookDelivery.count(),
      db.webhookDelivery.count({ where: { source: 'SHOPIFY' } }),
      db.webhookDelivery.count({ where: { source: 'WHATSAPP' } }),
      db.webhookDelivery.count({ where: { source: 'COURIER' } }),
      db.webhookDelivery.count({ where: { processed: true } }),
      db.webhookDelivery.count({ where: { processed: false } }),
    ])

    return ok({
      deliveries: deliveries.map((d) => ({
        id: d.id,
        source: d.source,
        eventType: d.eventType,
        processed: d.processed,
        error: d.error,
        processingTime: d.processingTime,
        receivedAt: d.receivedAt.toISOString(),
        processedAt: d.processedAt?.toISOString() || null,
        payloadSize: d.payload.length,
      })),
      summary: {
        total,
        shopify: shopifyCount,
        whatsapp: whatsappCount,
        courier: courierCount,
        processed: processedCount,
        failed: failedCount,
      },
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
