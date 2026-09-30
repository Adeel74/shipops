import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/auth'

// GET /api/v1/export/customers
// Exports customers as CSV
export async function GET() {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return new Response('Unauthorized', { status: 401 })

    const customers = await db.customer.findMany({
      where: { organizationId: ctx.organization.id },
      include: { addresses: { where: { isDefault: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    })

    const headers = [
      'Name', 'Phone', 'Email', 'City', 'Address',
      'Total Orders', 'Delivered', 'Returned', 'Risk Level', 'Risk Score', 'Joined',
    ]

    const rows = customers.map((c) => {
      const addr = c.addresses[0]
      return [
        `${c.firstName || ''} ${c.lastName || ''}`.trim(),
        c.phone || '',
        c.email || '',
        addr?.city || '',
        (addr?.addressLine1 || '').replace(/,/g, ';'),
        c.totalOrders.toString(),
        c.deliveredOrders.toString(),
        c.returnedOrders.toString(),
        c.riskLevel,
        c.riskScore.toString(),
        c.createdAt.toISOString().split('T')[0],
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="shipops-customers-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 })
  }
}
