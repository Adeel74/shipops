import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/auth'
import { NextRequest } from 'next/server'

// GET /api/v1/export/orders?status=ALL
// Exports orders as CSV
export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return new Response('Unauthorized', { status: 401 })

    const status = req.nextUrl.searchParams.get('status') || 'ALL'

    const orders = await db.order.findMany({
      where: {
        organizationId: ctx.organization.id,
        ...(status !== 'ALL' ? { status } : {}),
      },
      include: {
        customer: { include: { addresses: { where: { isDefault: true }, take: 1 } } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const headers = [
      'Order Number', 'Date', 'Customer Name', 'Phone', 'City', 'Address',
      'Items', 'COD Amount', 'Shipping Fee', 'Total', 'Status', 'Risk Level',
      'Risk Score', 'Courier', 'Tracking Number', 'Confirmation Method', 'Confirmed At',
    ]

    const rows = orders.map((o) => {
      const addr = o.customer.addresses[0]
      return [
        o.orderNumber,
        o.createdAt.toISOString().split('T')[0],
        `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.trim(),
        o.customer.phone || '',
        addr?.city || '',
        (addr?.addressLine1 || '').replace(/,/g, ';'),
        o.items.map((i) => `${i.title} x${i.quantity}`).join(' | ').replace(/,/g, ';'),
        o.totalAmount.toString(),
        o.shippingFee.toString(),
        o.totalAmount.toString(),
        o.status,
        o.riskLevel,
        o.riskScore.toString(),
        o.courier || '',
        o.trackingNumber || '',
        o.confirmationMethod || '',
        o.confirmedAt?.toISOString().split('T')[0] || '',
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="shipops-orders-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 })
  }
}
