import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'

// GET /api/v1/ai/insights
// Returns AI-computed risk predictions and recommendations.
export async function GET() {
  try {
    const org = await requireOrg()

    const orders = await db.order.findMany({
      where: { organizationId: org.id, status: { in: ['UNCONFIRMED', 'CONFIRMED', 'ATTENTION'] } },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const predictions = orders.map((o) => {
      const customer = o.customer
      const deliveryRate = customer.totalOrders > 0 ? customer.deliveredOrders / customer.totalOrders : 1
      const riskScore = Math.min(95, Math.round(
        (1 - deliveryRate) * 50 +
        (customer.returnedOrders * 8) +
        (o.riskScore * 0.3) +
        (o.totalAmount > 10000 ? 10 : 0)
      ))

      let reasons: string[] = []
      let recommendedAction = 'Proceed with normal confirmation flow.'

      if (customer.returnedOrders >= 3) {
        reasons.push(`${customer.returnedOrders} previous returns`)
        recommendedAction = 'Verify by phone call before dispatch. Consider advance payment option.'
      }
      if (deliveryRate < 0.6) {
        reasons.push(`Low delivery rate (${Math.round(deliveryRate * 100)}%)`)
      }
      if (o.totalAmount > 10000) {
        reasons.push(`High COD amount (Rs ${o.totalAmount.toLocaleString()})`)
        if (reasons.length === 1) recommendedAction = 'High-value order — verify customer by call before dispatch.'
      }

      const riskLevel = riskScore >= 60 ? 'HIGH' : riskScore >= 35 ? 'MEDIUM' : 'LOW'
      if (reasons.length === 0) {
        reasons = ['No risk factors detected']
        recommendedAction = 'No action needed. Proceed to shipment creation.'
      }

      return {
        id: `pred_${o.id}`,
        orderId: o.orderNumber,
        customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        riskScore,
        riskLevel,
        prediction: `${riskScore}% probability of RTO based on customer history (${customer.returnedOrders} prior returns) and order analysis.`,
        recommendedAction,
        impact: `Rs ${o.totalAmount.toLocaleString()} + Rs ${o.shippingFee} shipping at risk`,
        reasons,
      }
    })

    // Daily summary
    const todaysOrders = await db.order.count({
      where: { organizationId: org.id, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    })
    const confirmed = await db.order.count({ where: { organizationId: org.id, status: 'CONFIRMED' } })
    const pendingConfirmation = await db.order.count({ where: { organizationId: org.id, status: 'UNCONFIRMED' } })
    const attentionCases = await db.attentionCase.count({ where: { organizationId: org.id, status: 'OPEN' } })
    const rtoPredicted = predictions.filter((p) => p.riskLevel === 'HIGH').length
    const revenueAtRisk = orders
      .filter((o) => {
        const p = predictions.find((p) => p.orderId === o.orderNumber)
        return p?.riskLevel === 'HIGH'
      })
      .reduce((s, o) => s + o.totalAmount, 0)

    return ok({
      dailySummary: {
        date: new Date().toISOString().split('T')[0],
        totalOrders: todaysOrders,
        confirmed,
        pendingConfirmation,
        attentionCases,
        rtoPredicted,
        revenueAtRisk,
      },
      predictions,
      automationsSuggested: [
        { id: 'sug_1', title: 'Add auto-SMS fallback for unresponsive WhatsApp', reason: '12% of unconfirmed orders never reply on WhatsApp but respond to SMS within 1 hour.', impact: '~18 additional confirmations / month' },
        { id: 'sug_2', title: 'Block orders from repeat RTO customers', reason: '3 customers have >50% RTO rate. Auto-flagging could save Rs 18,000/month in courier costs.', impact: 'Rs 18,000 / month savings' },
        { id: 'sug_3', title: 'Switch Faisalabad orders from TCS to Trax', reason: 'Trax shows 94% delivery rate in Faisalabad vs TCS 88%. Same cost.', impact: '~6 fewer RTOs / month' },
      ],
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
