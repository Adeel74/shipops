import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/v1/public/track?tracking=TCS-78451236
// Public endpoint — no auth required. Customers use this to track orders.
export async function GET(req: NextRequest) {
  try {
    // Rate limit: 30 requests per minute per IP
    const ip = getClientIP(req)
    const rateLimit = checkRateLimit(`track:${ip}`, RATE_LIMITS.PUBLIC)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' } },
        { status: 429 }
      )
    }

    const tracking = req.nextUrl.searchParams.get('tracking') || ''

    if (!tracking || tracking.length < 3) {
      return err('VALIDATION_ERROR', 'Tracking number required', 400)
    }

    // Find shipment by tracking number
    const shipment = await db.shipment.findFirst({
      where: { trackingNumber: tracking },
      include: {
        order: {
          include: {
            customer: { include: { addresses: { where: { isDefault: true }, take: 1 } } },
            items: true,
            organization: { select: { name: true, currency: true } },
          },
        },
        trackingEvents: { orderBy: { eventTime: 'desc' } },
      },
    })

    if (!shipment) {
      return err('NOT_FOUND', 'No shipment found with this tracking number', 404)
    }

    const order = shipment.order
    const customer = order.customer
    const address = customer.addresses[0]

    // Map order status to customer-friendly delivery status
    const deliveryStatusMap: Record<string, { label: string; step: number; color: string }> = {
      SHIPMENT_CREATED: { label: 'Order Confirmed', step: 1, color: 'sky' },
      IN_TRANSIT: { label: 'In Transit', step: 2, color: 'indigo' },
      OUT_FOR_DELIVERY: { label: 'Out for Delivery', step: 3, color: 'blue' },
      DELIVERED: { label: 'Delivered', step: 4, color: 'emerald' },
      ATTENTION: { label: 'Needs Attention', step: 0, color: 'amber' },
      RETURNING: { label: 'Returning', step: 0, color: 'orange' },
      RETURNED: { label: 'Returned', step: 0, color: 'rose' },
      CANCELLED: { label: 'Cancelled', step: 0, color: 'zinc' },
    }

    const statusInfo = deliveryStatusMap[order.status] || { label: order.status, step: 0, color: 'zinc' }

    return ok({
      trackingNumber: shipment.trackingNumber,
      courier: shipment.order.courier,
      status: order.status,
      statusLabel: statusInfo.label,
      statusStep: statusInfo.step,
      statusColor: statusInfo.color,
      orderNumber: order.orderNumber,
      organization: order.organization.name,
      customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      city: address?.city || '',
      codAmount: order.totalAmount,
      isCod: order.isCod,
      currency: order.organization.currency,
      items: order.items.map((i) => ({
        title: i.title,
        quantity: i.quantity,
        totalPrice: i.totalPrice,
      })),
      shippedAt: shipment.shippedAt?.toISOString(),
      deliveredAt: shipment.deliveredAt?.toISOString(),
      estimatedDelivery: shipment.shippedAt
        ? new Date(new Date(shipment.shippedAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
        : null,
      events: shipment.trackingEvents.map((e) => ({
        id: e.id,
        status: e.status,
        description: e.description || '',
        location: e.location || null,
        eventTime: e.eventTime.toISOString(),
        source: e.source,
        isWarning: e.isWarning,
      })),
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
