import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { NextRequest } from 'next/server'

// POST /api/webhooks/courier/:provider
// Receives tracking events from courier integrations (TCS, Leopards, Trax, etc.)
// Body format: { tracking_number, status, event_code, description, location, event_time }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const body = await req.json()

    const { tracking_number, status, event_code, description, location, event_time } = body

    if (!tracking_number || !status) {
      return err('VALIDATION_ERROR', 'tracking_number and status are required', 400)
    }

    // Find shipment by tracking number
    const shipment = await db.shipment.findFirst({
      where: { trackingNumber: tracking_number },
      include: { order: true },
    })

    if (!shipment) {
      return err('NOT_FOUND', `Shipment not found for tracking: ${tracking_number}`, 404)
    }

    // Create tracking event
    const eventTime = event_time ? new Date(event_time) : new Date()
    const isWarning = ['FAILED', 'REFUSED', 'RETURN', 'EXCEPTION', 'RD'].some((c) =>
      (event_code || '').toUpperCase().includes(c) || status.toUpperCase().includes(c)
    )

    await db.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status,
        eventCode: event_code || null,
        description: description || '',
        location: location || null,
        eventTime,
        source: 'COURIER',
        isWarning,
      },
    })

    // Update shipment + order status based on courier event
    const orderStatusMap: Record<string, string> = {
      PICKED_UP: 'SHIPMENT_CREATED',
      IN_TRANSIT: 'IN_TRANSIT',
      OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
      DELIVERED: 'DELIVERED',
      REFUSED: 'ATTENTION',
      FAILED_DELIVERY: 'ATTENTION',
      RETURN_INITIATED: 'RETURNING',
      RETURNED: 'RETURNED',
    }

    const newOrderStatus = orderStatusMap[status.toUpperCase()] || shipment.order.status
    if (newOrderStatus !== shipment.order.status) {
      const oldStatus = shipment.order.status
      await db.order.update({
        where: { id: shipment.orderId },
        data: { status: newOrderStatus },
      })
      await db.orderStatusHistory.create({
        data: {
          orderId: shipment.orderId,
          oldStatus,
          newStatus: newOrderStatus,
          reason: `Courier event: ${status}`,
          source: 'COURIER_WEBHOOK',
        },
      })

      // If delivered, update customer delivery count
      if (newOrderStatus === 'DELIVERED') {
        await db.customer.update({
          where: { id: shipment.order.customerId },
          data: { deliveredOrders: { increment: 1 } },
        })
        await db.shipment.update({ where: { id: shipment.id }, data: { deliveredAt: new Date() } })
      }

      // If returning/returned, update customer return count
      if (newOrderStatus === 'RETURNED') {
        await db.customer.update({
          where: { id: shipment.order.customerId },
          data: { returnedOrders: { increment: 1 } },
        })
        await db.shipment.update({ where: { id: shipment.id }, data: { returnedAt: new Date() } })
      }

      // If attention needed, create attention case
      if (newOrderStatus === 'ATTENTION') {
        const attentionTypeMap: Record<string, string> = {
          REFUSED: 'CUSTOMER_REFUSED',
          FAILED_DELIVERY: 'FAILED_DELIVERY',
        }
        const attentionType = attentionTypeMap[status.toUpperCase()] || 'FAILED_DELIVERY'

        await db.attentionCase.create({
          data: {
            organizationId: shipment.order.organizationId,
            orderId: shipment.orderId,
            customerId: shipment.order.customerId,
            shipmentId: shipment.id,
            type: attentionType,
            priority: attentionType === 'CUSTOMER_REFUSED' ? 'URGENT' : 'HIGH',
            status: 'OPEN',
            title: `Courier: ${status}`,
            description: description || `Courier reported: ${status}`,
            recommendedAction: 'Send WhatsApp recovery message to customer',
            aiConfidence: 85,
          },
        })
      }
    }

    return ok({ received: true, provider, tracking: tracking_number, status })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}

// GET — webhook verification (some couriers use GET)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  return ok({ status: 'ok', message: `ShipOps courier webhook for ${provider} is active` })
}
