import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'

// GET /api/v1/orders?status=UNCONFIRMED
export async function GET(req: NextRequest) {
  try {
    const org = await requireOrg()
    const status = req.nextUrl.searchParams.get('status')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100')

    const orders = await db.order.findMany({
      where: {
        organizationId: org.id,
        ...(status && status !== 'ALL' ? { status } : {}),
      },
      include: {
        items: true,
        customer: { include: { addresses: { where: { isDefault: true }, take: 1 } } },
        shipment: { include: { trackingEvents: { orderBy: { eventTime: 'desc' } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Fetch evidence counts
    const ordersWithEvidence = await Promise.all(
      orders.map(async (o) => {
        const evidenceCount = await db.evidenceItem.count({ where: { orderId: o.id } })
        const defaultAddress = o.customer.addresses[0]
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          customerId: o.customerId,
          customerName: `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.trim(),
          customerPhone: o.customer.phone || '',
          city: defaultAddress?.city || '',
          address: defaultAddress?.addressLine1 || '',
          items: o.items.map((i) => ({
            id: i.id,
            productId: i.productId || '',
            title: i.title,
            sku: i.sku || undefined,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
          })),
          codAmount: o.totalAmount,
          shippingFee: o.shippingFee,
          totalAmount: o.totalAmount,
          isCod: o.isCod,
          status: o.status,
          riskScore: o.riskScore,
          riskLevel: o.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
          confirmationMethod: o.confirmationMethod as 'WHATSAPP' | 'CALL' | 'SMS' | 'MANUAL' | 'AUTO_CALL' | undefined,
          confirmedAt: o.confirmedAt?.toISOString(),
          courier: o.courier as 'TCS' | 'LEOPARDS' | 'M&P' | 'TRAX' | 'POSTEX' | 'CALL_COURIER' | 'RIDER' | undefined,
          trackingNumber: o.trackingNumber || undefined,
          attentionType: o.attentionType as 'BAD_ADDRESS' | 'CUSTOMER_UNREACHABLE' | 'CUSTOMER_REFUSED' | 'FAILED_DELIVERY' | 'COURIER_DELAY' | 'HIGH_RTO_RISK' | 'PAYMENT_ISSUE' | 'DUPLICATE_ORDER' | undefined,
          attentionReason: o.attentionReason || undefined,
          attentionOverdueHours: o.attentionOverdueHours || undefined,
          attentionAttemptsLeft: o.attentionAttemptsLeft || undefined,
          returnReason: o.returnReason || undefined,
          recommendedAction: o.recommendedAction || undefined,
          evidenceCount,
          shipment: o.shipment
            ? {
                id: o.shipment.id,
                trackingNumber: o.shipment.trackingNumber || '',
                courier: (o.courier || '') as 'TCS' | 'LEOPARDS' | 'M&P' | 'TRAX' | 'POSTEX' | 'CALL_COURIER' | 'RIDER',
                status: o.shipment.status,
                shippingCost: o.shipment.shippingCost || 0,
                codAmount: o.shipment.codAmount || 0,
                shippedAt: o.shipment.shippedAt?.toISOString() || '',
                events: o.shipment.trackingEvents.map((e) => ({
                  id: e.id,
                  status: e.status,
                  description: e.description || '',
                  location: e.location || undefined,
                  eventTime: e.eventTime.toISOString(),
                  source: e.source as 'COURIER' | 'SHIPOPS' | 'AI' | 'CUSTOMER',
                  isWarning: e.isWarning,
                })),
              }
            : undefined,
          createdAt: o.createdAt.toISOString(),
        }
      })
    )

    return ok({ orders: ordersWithEvidence, total: ordersWithEvidence.length })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
