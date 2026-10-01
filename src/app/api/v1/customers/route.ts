import { db } from '@/lib/db'
import { requireOrg, ok, err } from '@/lib/api'

// GET /api/v1/customers
export async function GET() {
  try {
    const org = await requireOrg()
    const customers = await db.customer.findMany({
      where: { organizationId: org.id },
      include: { addresses: { where: { isDefault: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    })

    return ok({
      customers: customers.map((c) => ({
        id: c.id,
        firstName: c.firstName || '',
        lastName: c.lastName || '',
        phone: c.phone || '',
        email: c.email || undefined,
        city: c.addresses[0]?.city || '',
        address: c.addresses[0]?.addressLine1 || '',
        totalOrders: c.totalOrders,
        deliveredOrders: c.deliveredOrders,
        returnedOrders: c.returnedOrders,
        riskScore: c.riskScore,
        riskLevel: c.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
        joinedAt: c.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    return err('INTERNAL_ERROR', (e as Error).message, 500)
  }
}
