import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'

// GET /api/v1/couriers
export async function GET() {
  try {
    const org = await requireOrg()
    const couriers = await db.courierAccount.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'asc' },
    })

    // Compute stats per courier
    const courierMeta: Record<string, { displayName: string; logoColor: string; description: string }> = {
      TCS: { displayName: 'TCS', logoColor: '#E63946', description: "Pakistan's largest courier network. Best for major cities and high-value COD." },
      LEOPARDS: { displayName: 'Leopards Courier', logoColor: '#F4A261', description: 'Wide coverage including remote areas. Competitive rates for bulk dispatch.' },
      TRAX: { displayName: 'Trax Online', logoColor: '#2A9D8F', description: 'Fast COD remittance cycle (T+3). Good for cash flow sensitive operations.' },
      'M&P': { displayName: 'M&P Courier', logoColor: '#6A4C93', description: 'Strong in Punjab region. Same-day pickup in Lahore.' },
      POSTEX: { displayName: 'PostEx', logoColor: '#1D3557', description: 'Digital-first courier with real-time API. Fast remittance (T+1).' },
      CALL_COURIER: { displayName: 'Call Courier', logoColor: '#457B9D', description: 'Cost-effective for small parcels. Nationwide coverage.' },
      RIDER: { displayName: 'Rider (Local)', logoColor: '#8D99AE', description: 'Same-day delivery within Karachi. Setup required for local dispatch.' },
    }

    const result = await Promise.all(
      couriers.map(async (c) => {
        const shipments = await db.shipment.findMany({
          where: { courierAccountId: c.id },
          select: { status: true, shippingCost: true },
        })
        const delivered = shipments.filter((s) => s.status === 'DELIVERED').length
        const deliveryRate = shipments.length > 0 ? Math.round((delivered / shipments.length) * 1000) / 10 : 0
        const avgCost = shipments.length > 0 ? Math.round(shipments.reduce((s, sh) => s + (sh.shippingCost || 0), 0) / shipments.length) : 0

        return {
          id: c.id,
          provider: c.provider,
          displayName: courierMeta[c.provider]?.displayName || c.provider,
          accountName: c.accountName,
          accountNumber: c.accountNumber || undefined,
          status: c.status === 'ACTIVE' ? 'CONNECTED' : 'DISCONNECTED',
          connectedAt: c.createdAt.toISOString().split('T')[0],
          shipmentsCount: shipments.length,
          deliveryRate,
          avgCost,
          logoColor: courierMeta[c.provider]?.logoColor || '#8D99AE',
          description: courierMeta[c.provider]?.description || '',
        }
      })
    )

    // Add unconnected couriers
    const connectedProviders = couriers.map((c) => c.provider)
    for (const provider of Object.keys(courierMeta)) {
      if (!connectedProviders.includes(provider)) {
        const meta = courierMeta[provider]
        result.push({
          id: `disconnected_${provider}`,
          provider,
          displayName: meta.displayName,
          accountName: '',
          status: 'DISCONNECTED',
          connectedAt: undefined,
          shipmentsCount: 0,
          deliveryRate: 0,
          avgCost: 120,
          logoColor: meta.logoColor,
          description: meta.description,
        })
      }
    }

    return ok({ couriers: result })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
