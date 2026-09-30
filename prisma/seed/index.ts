// ShipOps — Database seed script
// Creates: demo organization, owner user, stores, customers, products, orders,
// shipments, tracking events, attention cases, automation rules, team members.
//
// Run: bun run prisma/seed/index.ts

import { PrismaClient } from '@prisma/client'
import { createHash, randomBytes } from 'crypto'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding ShipOps database...')

  // Clean slate
  await db.auditLog.deleteMany()
  await db.automationRun.deleteMany()
  await db.automationRule.deleteMany()
  await db.evidenceItem.deleteMany()
  await db.return.deleteMany()
  await db.attentionCase.deleteMany()
  await db.trackingEvent.deleteMany()
  await db.shipment.deleteMany()
  await db.courierAccount.deleteMany()
  await db.whatsAppMessage.deleteMany()
  await db.whatsAppAccount.deleteMany()
  await db.orderStatusHistory.deleteMany()
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.product.deleteMany()
  await db.address.deleteMany()
  await db.customer.deleteMany()
  await db.store.deleteMany()
  await db.organizationInvitation.deleteMany()
  await db.session.deleteMany()
  await db.organizationMember.deleteMany()
  await db.organization.deleteMany()
  await db.user.deleteMany()

  // ============================================================
  // USERS + ORGANIZATION
  // ============================================================
  const hashPassword = (pw: string) => createHash('sha256').update(pw + 'shipops-salt').digest('hex')

  const hamza = await db.user.create({
    data: {
      name: 'Hamza Sheikh',
      email: 'hamza@demostore.pk',
      passwordHash: hashPassword('demo1234'),
    },
  })
  const ayesha = await db.user.create({
    data: {
      name: 'Ayesha Tariq',
      email: 'ayesha.ops@demostore.pk',
      passwordHash: hashPassword('demo1234'),
    },
  })
  const bilal = await db.user.create({
    data: {
      name: 'Bilal Khan',
      email: 'bilal@demostore.pk',
      passwordHash: hashPassword('demo1234'),
    },
  })
  const sana = await db.user.create({
    data: {
      name: 'Sana Malik',
      email: 'sana@demostore.pk',
      passwordHash: hashPassword('demo1234'),
    },
  })
  const usman = await db.user.create({
    data: {
      name: 'Usman Ali',
      email: 'usman@demostore.pk',
      passwordHash: hashPassword('demo1234'),
    },
  })

  const org = await db.organization.create({
    data: {
      name: 'Demo Store PK',
      slug: 'demo-store-pk',
      country: 'Pakistan',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
    },
  })

  // Memberships
  await db.organizationMember.create({ data: { organizationId: org.id, userId: hamza.id, role: 'OWNER' } })
  await db.organizationMember.create({ data: { organizationId: org.id, userId: ayesha.id, role: 'ADMIN' } })
  await db.organizationMember.create({ data: { organizationId: org.id, userId: bilal.id, role: 'MANAGER' } })
  await db.organizationMember.create({ data: { organizationId: org.id, userId: sana.id, role: 'OPERATOR' } })
  await db.organizationMember.create({ data: { organizationId: org.id, userId: usman.id, role: 'OPERATOR' } })

  // Invitation (pending)
  await db.organizationInvitation.create({
    data: {
      organizationId: org.id,
      email: 'nida@demostore.pk',
      role: 'VIEWER',
      tokenHash: createHash('sha256').update(randomBytes(32).toString('hex')).digest('hex'),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  // ============================================================
  // STORE (Shopify)
  // ============================================================
  const store = await db.store.create({
    data: {
      organizationId: org.id,
      platform: 'SHOPIFY',
      name: 'Demo Store PK',
      shopDomain: 'demo-store-pk.myshopify.com',
      shopifyStoreId: 'shop_784512',
      accessTokenEncrypted: 'shpat_demo_encrypted_token_placeholder',
      status: 'ACTIVE',
    },
  })

  // ============================================================
  // COURIER ACCOUNTS
  // ============================================================
  const couriers = [
    { provider: 'TCS', accountName: 'Main Account', accountNumber: 'TC-784512', apiKeyEncrypted: 'tcs_key_***' },
    { provider: 'LEOPARDS', accountName: 'Primary', accountNumber: 'LP-552178', apiKeyEncrypted: 'leo_key_***' },
    { provider: 'TRAX', accountName: 'Default', accountNumber: 'TR-998123', apiKeyEncrypted: 'trx_key_***' },
    { provider: 'M&P', accountName: 'Main', accountNumber: 'MP-445678', apiKeyEncrypted: 'mnp_key_***' },
    { provider: 'POSTEX', accountName: 'Default', accountNumber: 'PX-220014', apiKeyEncrypted: 'pfx_key_***' },
    { provider: 'CALL_COURIER', accountName: 'Main', accountNumber: 'CC-665012', apiKeyEncrypted: 'cc_key_***' },
  ]
  const courierAccounts: Record<string, string> = {}
  for (const c of couriers) {
    const acct = await db.courierAccount.create({
      data: { organizationId: org.id, ...c, status: 'ACTIVE' },
    })
    courierAccounts[c.provider] = acct.id
  }

  // ============================================================
  // PRODUCTS
  // ============================================================
  const products = [
    { title: 'Cotton Unstitched Suit (3 Piece)', sku: 'COT-3PC-RED', price: 4500 },
    { title: "Men's Casual Kameez Shalwar", sku: 'MEN-CS-WHT', price: 2400 },
    { title: 'Leather Sandals', sku: 'LTH-SND-42', price: 1400 },
    { title: 'Lawn Printed Suit (Summer Collection)', sku: 'LWN-PRT-GRN', price: 3800 },
    { title: "Women's Khussa (Embellished)", sku: 'WMN-KHS-38', price: 2200 },
    { title: 'Embroidered Bed Sheet Set (Double)', sku: 'BED-EMB-DBL', price: 5400 },
    { title: "Men's Formal Watch (Stainless Steel)", sku: 'MEN-WAT-STL', price: 8900 },
    { title: 'Leather Wallet', sku: 'LTH-WLT-BRN', price: 1600 },
    { title: 'Hijab Cap Set (Pack of 3)', sku: 'HJB-CAP-3PK', price: 1450 },
    { title: 'Smartphone (6GB RAM, 128GB)', sku: 'SPH-6128-BLK', price: 38900 },
    { title: 'Designer Handbag (Faux Leather)', sku: 'DSG-HB-BLK', price: 8900 },
    { title: 'Bluetooth Earbuds (Pro)', sku: 'BT-EARB-PRO', price: 5400 },
    { title: 'Perfume Set (3 x 50ml)', sku: 'PRF-SET-3PK', price: 5400 },
    { title: "Men's Wallet & Belt Combo", sku: 'MEN-WLT-BLT', price: 3200 },
    { title: 'Home Decor Set (4 items)', sku: 'HOM-DEC-4PK', price: 4200 },
    { title: 'Hair Care Combo (Shampoo + Conditioner)', sku: 'HCR-COM-2PK', price: 2800 },
  ]
  const productMap: Record<string, string> = {}
  for (const p of products) {
    const prod = await db.product.create({ data: { organizationId: org.id, ...p, status: 'ACTIVE' } })
    productMap[p.sku] = prod.id
  }

  // ============================================================
  // CUSTOMERS
  // ============================================================
  const customerData = [
    { firstName: 'Ayesha', lastName: 'Khan', phone: '0301-2345678', email: 'ayesha.khan@email.com', city: 'Lahore', address: 'House 23, Block C, Gulberg III, Lahore', totalOrders: 12, deliveredOrders: 9, returnedOrders: 3, riskScore: 25, riskLevel: 'LOW' },
    { firstName: 'Bilal', lastName: 'Ahmed', phone: '0321-9876543', email: 'bilal.ahmed@email.com', city: 'Karachi', address: 'Flat 4B, Al-Habib Apartments, Tariq Road, Karachi', totalOrders: 5, deliveredOrders: 5, returnedOrders: 0, riskScore: 8, riskLevel: 'LOW' },
    { firstName: 'Sana', lastName: 'Tariq', phone: '0333-4567890', city: 'Multan', address: 'Street 7, Cantt, Multan', totalOrders: 8, deliveredOrders: 4, returnedOrders: 4, riskScore: 72, riskLevel: 'HIGH' },
    { firstName: 'Hira', lastName: 'Saleem', phone: '0345-1122334', city: 'Islamabad', address: 'Plot 12, Street 9, F-8/3, Islamabad', totalOrders: 3, deliveredOrders: 2, returnedOrders: 1, riskScore: 45, riskLevel: 'MEDIUM' },
    { firstName: 'Usman', lastName: 'Raza', phone: '0300-5566778', email: 'usman.raza@email.com', city: 'Faisalabad', address: 'House 156, Peoples Colony No. 2, Faisalabad', totalOrders: 15, deliveredOrders: 13, returnedOrders: 2, riskScore: 18, riskLevel: 'LOW' },
    { firstName: 'Maham', lastName: 'Ali', phone: '0312-8899001', city: 'Rawalpindi', address: 'Flat 7, Saddar Plaza, Saddar, Rawalpindi', totalOrders: 6, deliveredOrders: 3, returnedOrders: 3, riskScore: 68, riskLevel: 'HIGH' },
    { firstName: 'Fatima', lastName: 'Noor', phone: '0322-3344556', city: 'Peshawar', address: 'University Town, Peshawar', totalOrders: 9, deliveredOrders: 8, returnedOrders: 1, riskScore: 12, riskLevel: 'LOW' },
    { firstName: 'Kamran', lastName: 'Sheikh', phone: '0346-7788990', email: 'kamran.sheikh@email.com', city: 'Karachi', address: 'Bungalow 89, DHA Phase 6, Karachi', totalOrders: 22, deliveredOrders: 21, returnedOrders: 1, riskScore: 5, riskLevel: 'LOW' },
  ]
  const customerMap: Record<string, string> = {}
  for (const c of customerData) {
    const { city, address, ...custFields } = c
    const cust = await db.customer.create({ data: { organizationId: org.id, ...custFields } })
    customerMap[c.phone] = cust.id
    await db.address.create({
      data: {
        customerId: cust.id,
        addressLine1: address,
        city: city,
        country: 'Pakistan',
        isDefault: true,
      },
    })
  }

  // ============================================================
  // ORDERS (sample with full lifecycle)
  // ============================================================
  const now = new Date('2026-10-01T09:35:00')

  const createOrder = async (data: {
    orderNumber: string
    shopifyOrderId: string
    customerPhone: string
    status: string
    isCod: boolean
    items: { sku: string; qty: number }[]
    riskScore: number
    riskLevel: string
    confirmationMethod?: string
    confirmedAt?: Date
    courier?: string
    trackingNumber?: string
    attentionType?: string
    attentionReason?: string
    attentionOverdueHours?: number
    attentionAttemptsLeft?: number
    returnReason?: string
    recommendedAction?: string
    createdAt: Date
    trackingEvents?: { status: string; description: string; location?: string; eventTime: Date; source: string; isWarning?: boolean }[]
    evidence?: { type: string; title: string; detail: string; timestamp: Date; source: string }[]
  }) => {
    const customerId = customerMap[data.customerPhone]
    const items = data.items.map((i) => {
      const p = products.find((pp) => pp.sku === i.sku)!
      return { title: p.title, sku: p.sku, quantity: i.qty, unitPrice: p.price, totalPrice: p.price * i.qty, productId: productMap[i.sku] }
    })
    const subtotal = items.reduce((s, i) => s + i.totalPrice, 0)
    const shippingFee = 200
    const totalAmount = subtotal + shippingFee

    const order = await db.order.create({
      data: {
        organizationId: org.id,
        storeId: store.id,
        customerId,
        shopifyOrderId: data.shopifyOrderId,
        orderNumber: data.orderNumber,
        isCod: data.isCod,
        paymentMethod: data.isCod ? 'COD' : 'PREPAID',
        subtotal,
        shippingFee,
        totalAmount,
        currency: 'PKR',
        status: data.status,
        riskScore: data.riskScore,
        riskLevel: data.riskLevel,
        confirmationMethod: data.confirmationMethod,
        confirmedAt: data.confirmedAt,
        courier: data.courier,
        trackingNumber: data.trackingNumber,
        attentionType: data.attentionType,
        attentionReason: data.attentionReason,
        attentionOverdueHours: data.attentionOverdueHours,
        attentionAttemptsLeft: data.attentionAttemptsLeft,
        returnReason: data.returnReason,
        recommendedAction: data.recommendedAction,
        createdAt: data.createdAt,
        items: { create: items },
      },
    })

    // Status history
    await db.orderStatusHistory.create({
      data: {
        orderId: order.id,
        newStatus: data.status,
        source: 'SEED',
        createdAt: data.createdAt,
      },
    })

    // Shipment + tracking
    if (data.courier && data.trackingNumber && courierAccounts[data.courier]) {
      const shipment = await db.shipment.create({
        data: {
          organizationId: org.id,
          orderId: order.id,
          courierAccountId: courierAccounts[data.courier],
          trackingNumber: data.trackingNumber,
          externalId: `ext_${data.trackingNumber}`,
          status: data.status,
          shippingCost: 220,
          codAmount: totalAmount,
          shippedAt: new Date(data.createdAt.getTime() + 24 * 60 * 60 * 1000),
        },
      })
      if (data.trackingEvents) {
        for (const ev of data.trackingEvents) {
          await db.trackingEvent.create({
            data: {
              shipmentId: shipment.id,
              status: ev.status,
              description: ev.description,
              location: ev.location,
              eventTime: ev.eventTime,
              source: ev.source,
              isWarning: ev.isWarning || false,
            },
          })
        }
      }
    }

    // Evidence
    if (data.evidence) {
      for (const ev of data.evidence) {
        await db.evidenceItem.create({
          data: {
            orderId: order.id,
            type: ev.type,
            title: ev.title,
            detail: ev.detail,
            timestamp: ev.timestamp,
            source: ev.source,
          },
        })
      }
    }

    return order
  }

  // UNCONFIRMED
  await createOrder({
    orderNumber: '#1043', shopifyOrderId: '1043', customerPhone: '0301-2345678',
    status: 'UNCONFIRMED', isCod: true, riskScore: 25, riskLevel: 'LOW',
    items: [{ sku: 'COT-3PC-RED', qty: 1 }],
    confirmationMethod: 'AUTO_CALL',
    recommendedAction: 'Customer answered auto-call and pressed 1. Auto-confirm in 30 minutes if no dispute.',
    createdAt: new Date('2026-10-01T08:23:00'),
  })
  await createOrder({
    orderNumber: '#1044', shopifyOrderId: '1044', customerPhone: '0321-9876543',
    status: 'UNCONFIRMED', isCod: true, riskScore: 8, riskLevel: 'LOW',
    items: [{ sku: 'MEN-CS-WHT', qty: 2 }, { sku: 'LTH-SND-42', qty: 1 }],
    confirmationMethod: 'WHATSAPP',
    recommendedAction: 'Low-risk repeat customer (5/5 delivered). Send WhatsApp confirmation template.',
    createdAt: new Date('2026-10-01T08:47:00'),
  })
  await createOrder({
    orderNumber: '#1045', shopifyOrderId: '1045', customerPhone: '0333-4567890',
    status: 'UNCONFIRMED', isCod: true, riskScore: 72, riskLevel: 'HIGH',
    items: [{ sku: 'LWN-PRT-GRN', qty: 1 }],
    recommendedAction: 'HIGH RISK — verify customer by phone call before dispatch. Consider advance payment option.',
    createdAt: new Date('2026-10-01T09:12:00'),
  })
  await createOrder({
    orderNumber: '#1046', shopifyOrderId: '1046', customerPhone: '0322-3344556',
    status: 'UNCONFIRMED', isCod: true, riskScore: 30, riskLevel: 'LOW',
    items: [{ sku: 'WMN-KHS-38', qty: 1 }],
    recommendedAction: 'New customer, low COD amount. Send WhatsApp confirmation.',
    createdAt: new Date('2026-10-01T09:34:00'),
  })

  // CONFIRMED
  await createOrder({
    orderNumber: '#1038', shopifyOrderId: '1038', customerPhone: '0301-2345678',
    status: 'CONFIRMED', isCod: true, riskScore: 25, riskLevel: 'LOW',
    items: [{ sku: 'BED-EMB-DBL', qty: 1 }],
    confirmationMethod: 'CALL', confirmedAt: new Date('2026-09-30T16:22:00'),
    createdAt: new Date('2026-09-30T15:10:00'),
  })
  await createOrder({
    orderNumber: '#1039', shopifyOrderId: '1039', customerPhone: '0300-5566778',
    status: 'CONFIRMED', isCod: true, riskScore: 18, riskLevel: 'LOW',
    items: [{ sku: 'MEN-WAT-STL', qty: 1 }, { sku: 'LTH-WLT-BRN', qty: 1 }],
    confirmationMethod: 'WHATSAPP', confirmedAt: new Date('2026-09-30T17:45:00'),
    createdAt: new Date('2026-09-30T17:12:00'),
  })
  await createOrder({
    orderNumber: '#1040', shopifyOrderId: '1040', customerPhone: '0322-3344556',
    status: 'CONFIRMED', isCod: true, riskScore: 12, riskLevel: 'LOW',
    items: [{ sku: 'HJB-CAP-3PK', qty: 1 }],
    confirmationMethod: 'WHATSAPP', confirmedAt: new Date('2026-09-30T18:30:00'),
    createdAt: new Date('2026-09-30T18:05:00'),
  })

  // IN TRANSIT
  await createOrder({
    orderNumber: '#1031', shopifyOrderId: '1031', customerPhone: '0321-9876543',
    status: 'IN_TRANSIT', isCod: true, riskScore: 8, riskLevel: 'LOW',
    items: [{ sku: 'MEN-CS-WHT', qty: 1 }],
    confirmedAt: new Date('2026-09-29T14:20:00'),
    courier: 'TCS', trackingNumber: 'TCS-78451236',
    createdAt: new Date('2026-09-29T13:45:00'),
    trackingEvents: [
      { status: 'Order Confirmed', description: 'Customer confirmed via WhatsApp', eventTime: new Date('2026-09-29T14:20:00'), source: 'SHIPOPS' },
      { status: 'Shipment Created', description: 'Shipment booked with TCS', eventTime: new Date('2026-09-30T08:45:00'), source: 'SHIPOPS' },
      { status: 'Picked Up', description: 'Package picked up from warehouse', location: 'Lahore Sort Hub', eventTime: new Date('2026-09-30T09:00:00'), source: 'COURIER' },
      { status: 'In Transit', description: 'Departed from Lahore Sorting Center', location: 'Lahore', eventTime: new Date('2026-09-30T14:30:00'), source: 'COURIER' },
      { status: 'In Transit', description: 'Arrived at Karachi Distribution Hub', location: 'Karachi', eventTime: new Date('2026-10-01T06:15:00'), source: 'COURIER' },
    ],
  })
  await createOrder({
    orderNumber: '#1032', shopifyOrderId: '1032', customerPhone: '0346-7788990',
    status: 'OUT_FOR_DELIVERY', isCod: true, riskScore: 5, riskLevel: 'LOW',
    items: [{ sku: 'SPH-6128-BLK', qty: 1 }],
    confirmedAt: new Date('2026-09-29T11:00:00'),
    courier: 'LEOPARDS', trackingNumber: 'LEO-5521789',
    createdAt: new Date('2026-09-29T10:30:00'),
    trackingEvents: [
      { status: 'Order Confirmed', description: 'Customer confirmed via call', eventTime: new Date('2026-09-29T11:00:00'), source: 'SHIPOPS' },
      { status: 'Picked Up', description: 'Package picked up', location: 'Lahore', eventTime: new Date('2026-09-30T10:00:00'), source: 'COURIER' },
      { status: 'In Transit', description: 'Arrived at Karachi Hub', location: 'Karachi', eventTime: new Date('2026-10-01T04:00:00'), source: 'COURIER' },
      { status: 'Out for Delivery', description: 'Out for delivery with rider Imran K.', location: 'Karachi — DHA', eventTime: new Date('2026-10-01T09:30:00'), source: 'COURIER' },
    ],
  })

  // NEEDS ATTENTION
  await createOrder({
    orderNumber: '#1025', shopifyOrderId: '1025', customerPhone: '0345-1122334',
    status: 'ATTENTION', isCod: true, riskScore: 45, riskLevel: 'MEDIUM',
    items: [{ sku: 'DSG-HB-BLK', qty: 1 }],
    confirmedAt: new Date('2026-09-28T13:00:00'),
    courier: 'TCS', trackingNumber: 'TCS-78419987',
    attentionType: 'BAD_ADDRESS', attentionReason: 'Courier cannot find the house',
    attentionOverdueHours: 24, attentionAttemptsLeft: 2,
    recommendedAction: 'Customer address incomplete — send WhatsApp message asking to confirm exact house/street number. Courier held the package for 1 more attempt.',
    createdAt: new Date('2026-09-28T12:15:00'),
    trackingEvents: [
      { status: 'Out for Delivery', description: 'Out for delivery', eventTime: new Date('2026-09-30T10:00:00'), source: 'COURIER' },
      { status: 'Delivery Attempt Failed', description: 'Rider could not locate address. Reason: incomplete address.', eventTime: new Date('2026-09-30T14:30:00'), source: 'COURIER', isWarning: true },
      { status: 'AI Recommendation', description: 'ShipOps AI flagged as BAD_ADDRESS. Recommended WhatsApp confirmation.', eventTime: new Date('2026-09-30T14:31:00'), source: 'AI' },
    ],
  })
  await createOrder({
    orderNumber: '#1026', shopifyOrderId: '1026', customerPhone: '0300-5566778',
    status: 'ATTENTION', isCod: true, riskScore: 18, riskLevel: 'LOW',
    items: [{ sku: 'BT-EARB-PRO', qty: 1 }],
    confirmedAt: new Date('2026-09-29T15:00:00'),
    courier: 'TRAX', trackingNumber: 'TRX-9981234',
    attentionType: 'CUSTOMER_UNREACHABLE', attentionReason: 'Rider marked not available',
    attentionOverdueHours: 19, attentionAttemptsLeft: 3,
    recommendedAction: 'Customer unavailable at delivery. Send WhatsApp asking for preferred delivery time window. Rider will retry tomorrow.',
    createdAt: new Date('2026-09-29T14:30:00'),
  })
  await createOrder({
    orderNumber: '#1027', shopifyOrderId: '1027', customerPhone: '0312-8899001',
    status: 'ATTENTION', isCod: true, riskScore: 68, riskLevel: 'HIGH',
    items: [{ sku: 'PRF-SET-3PK', qty: 1 }],
    confirmedAt: new Date('2026-09-29T10:00:00'),
    courier: 'M&P', trackingNumber: 'MNP-4456789',
    attentionType: 'CUSTOMER_REFUSED', attentionReason: 'Courier says customer refused to accept',
    attentionOverdueHours: 19, attentionAttemptsLeft: 1,
    recommendedAction: "Customer refused at door, but WhatsApp conversation shows they confirmed earlier. Send recovery message: 'Rider says you refused — was there an issue?'. This is a high-risk RTO pattern.",
    createdAt: new Date('2026-09-29T09:30:00'),
  })

  // DELIVERED
  await createOrder({
    orderNumber: '#1015', shopifyOrderId: '1015', customerPhone: '0300-5566778',
    status: 'DELIVERED', isCod: true, riskScore: 18, riskLevel: 'LOW',
    items: [{ sku: 'MEN-WLT-BLT', qty: 1 }],
    confirmedAt: new Date('2026-09-27T11:00:00'),
    courier: 'TCS', trackingNumber: 'TCS-78401122',
    createdAt: new Date('2026-09-27T10:30:00'),
    trackingEvents: [
      { status: 'Picked Up', description: 'Package picked up', eventTime: new Date('2026-09-28T09:00:00'), source: 'COURIER' },
      { status: 'Out for Delivery', description: 'Out for delivery', eventTime: new Date('2026-09-29T10:00:00'), source: 'COURIER' },
      { status: 'Delivered', description: 'Package delivered to customer', eventTime: new Date('2026-09-29T15:30:00'), source: 'COURIER' },
    ],
  })

  // RETURNING / RTO
  await createOrder({
    orderNumber: '#1053', shopifyOrderId: '1053', customerPhone: '0333-4567890',
    status: 'RETURNING', isCod: true, riskScore: 72, riskLevel: 'HIGH',
    items: [{ sku: 'HOM-DEC-4PK', qty: 1 }],
    confirmedAt: new Date('2026-09-26T12:00:00'),
    courier: 'POSTEX', trackingNumber: 'PFX-2200145',
    returnReason: 'Refused to accept',
    recommendedAction: 'RTO in progress. Customer WhatsApp reply contradicts courier ("Rider aaya hi nahi"). Escalate to courier dispute — evidence collected below.',
    createdAt: new Date('2026-09-26T11:30:00'),
    trackingEvents: [
      { status: 'Picked Up', description: 'Package picked up', eventTime: new Date('2026-09-28T09:00:00'), source: 'COURIER' },
      { status: 'Out for Delivery', description: 'Out for delivery', eventTime: new Date('2026-09-30T09:01:00'), source: 'COURIER' },
      { status: 'Delivery Refused', description: 'Receiver refused to accept. Code RD.', eventTime: new Date('2026-09-30T14:01:00'), source: 'COURIER', isWarning: true },
      { status: 'Return Initiated', description: 'Package on its way back to origin', eventTime: new Date('2026-09-30T16:30:00'), source: 'COURIER', isWarning: true },
    ],
    evidence: [
      { type: 'COURIER_EVENT', title: 'Out for delivery', detail: 'Courier dispatched rider for delivery', timestamp: new Date('2026-09-30T09:01:00'), source: 'PostEx' },
      { type: 'COURIER_EVENT', title: 'Receiver refused to accept', detail: 'Courier event code RD (Refused Delivery). Rider reported customer refused at door.', timestamp: new Date('2026-09-30T14:01:00'), source: 'PostEx' },
      { type: 'WHATSAPP', title: 'ShipOps Automation messaged customer', detail: "Auto-sent recovery message: 'We noticed a delivery issue with your order #1053. Was there a problem?'", timestamp: new Date('2026-09-30T15:40:00'), source: 'ShipOps Automation' },
      { type: 'CUSTOMER_REPLY', title: 'Customer replied on WhatsApp', detail: '"Rider aaya hi nahi. Main ghar par thi pura din."', timestamp: new Date('2026-09-30T15:44:00'), source: 'Customer' },
      { type: 'AGENT_ACTION', title: 'Dispute case opened', detail: 'Operator marked as COURIER_DISPUTE. Evidence bundle prepared for courier claim.', timestamp: new Date('2026-09-30T16:12:00'), source: 'Agent: Ayesha (Ops)' },
    ],
  })
  await createOrder({
    orderNumber: '#1048', shopifyOrderId: '1048', customerPhone: '0312-8899001',
    status: 'RETURNED', isCod: true, riskScore: 68, riskLevel: 'HIGH',
    items: [{ sku: 'HCR-COM-2PK', qty: 1 }],
    confirmedAt: new Date('2026-09-22T14:00:00'),
    courier: 'CALL_COURIER', trackingNumber: 'CALL-6650123',
    returnReason: 'Customer not available (3 attempts)',
    createdAt: new Date('2026-09-22T13:30:00'),
    evidence: [
      { type: 'COURIER_EVENT', title: 'Attempt 1 — Customer unavailable', detail: 'Rider visited at 11:30 AM. Door locked.', timestamp: new Date('2026-09-25T11:30:00'), source: 'Call Courier' },
      { type: 'WHATSAPP', title: 'ShipOps sent reminder', detail: "Auto-reminder: 'Your order is out for delivery tomorrow. Please be available.'", timestamp: new Date('2026-09-25T18:00:00'), source: 'ShipOps' },
      { type: 'COURIER_EVENT', title: 'Attempt 2 — Customer unavailable', detail: 'Rider visited at 4:15 PM. No response.', timestamp: new Date('2026-09-26T16:15:00'), source: 'Call Courier' },
      { type: 'COURIER_EVENT', title: 'Attempt 3 — Final attempt failed', detail: 'Customer did not respond to calls or door.', timestamp: new Date('2026-09-27T12:00:00'), source: 'Call Courier' },
      { type: 'AGENT_ACTION', title: 'Return processed', detail: 'RTO finalized. Stock return pending.', timestamp: new Date('2026-09-28T10:00:00'), source: 'Agent: Bilal' },
    ],
  })

  // ============================================================
  // ATTENTION CASES
  // ============================================================
  const attentionCases = [
    { orderNumber: '#1025', customerName: 'Hira Saleem', city: 'Islamabad', type: 'BAD_ADDRESS', title: 'Bad Address', description: 'Courier cannot find the house. Address missing plot/house number.', priority: 'HIGH', overdueHours: 24, attemptsLeft: 2, recommendedAction: 'Send WhatsApp message asking customer to confirm exact house/street number. Courier will hold for 1 more attempt.', aiConfidence: 92 },
    { orderNumber: '#1026', customerName: 'Usman Raza', city: 'Faisalabad', type: 'CUSTOMER_UNREACHABLE', title: 'Consignee Not Available', description: 'Rider marked customer not available at delivery. 3 attempts left.', priority: 'MEDIUM', overdueHours: 19, attemptsLeft: 3, recommendedAction: 'Send WhatsApp asking for preferred delivery time window. Schedule retry for tomorrow.', aiConfidence: 87 },
    { orderNumber: '#1027', customerName: 'Maham Ali', city: 'Rawalpindi', type: 'CUSTOMER_REFUSED', title: 'Refused to Accept', description: 'Courier says customer refused. But WhatsApp shows earlier confirmation. Possible courier dispute.', priority: 'URGENT', overdueHours: 19, attemptsLeft: 1, recommendedAction: 'Send recovery message immediately. High RTO risk. Collect evidence for courier dispute.', aiConfidence: 95 },
    { orderNumber: '#1042', customerName: 'Asad Mahmood', city: 'Lahore', type: 'COURIER_DELAY', title: 'Courier Delay', description: 'Shipment stuck at sort hub for 36 hours. No movement.', priority: 'MEDIUM', overdueHours: 36, recommendedAction: 'Contact TCS support. Consider re-dispatching via Leopards if no movement in 12h.', aiConfidence: 78 },
    { orderNumber: '#1041', customerName: 'Nida Yousuf', city: 'Karachi', type: 'DUPLICATE_ORDER', title: 'Possible Duplicate Order', description: 'Same customer placed 2 identical orders within 4 minutes. Likely accidental.', priority: 'LOW', overdueHours: 5, recommendedAction: 'Contact customer to confirm if both orders are intended. Cancel duplicate if not.', aiConfidence: 91 },
  ]
  for (const c of attentionCases) {
    const order = await db.order.findFirst({ where: { orderNumber: c.orderNumber } })
    await db.attentionCase.create({
      data: {
        organizationId: org.id,
        orderId: order?.id,
        type: c.type,
        priority: c.priority,
        status: 'OPEN',
        title: c.title,
        description: c.description,
        recommendedAction: c.recommendedAction,
        aiConfidence: c.aiConfidence,
        createdAt: new Date(now.getTime() - c.overdueHours * 60 * 60 * 1000),
      },
    })
  }

  // ============================================================
  // AUTOMATION RULES
  // ============================================================
  const automations = [
    { name: 'COD WhatsApp Confirmation', description: 'Send WhatsApp confirmation request when a new COD order arrives from Shopify.', trigger: 'ORDER_CREATED', triggerLabel: 'Order Created', conditions: ['Payment method = COD', 'Order status = UNCONFIRMED'], actions: ["Send WhatsApp template 'order_confirm'", 'Schedule reminder #1 after 30 min'], enabled: true, runsLast30Days: 1842, successRate: 94 },
    { name: 'Confirmation Reminder #1', description: 'If no customer reply in 30 minutes, send first reminder.', trigger: 'ORDER_PENDING_30MIN', triggerLabel: 'No reply 30 min', conditions: ['Order status = UNCONFIRMED', 'No customer reply in 30 min'], actions: ['Send WhatsApp reminder #1'], enabled: true, runsLast30Days: 612, successRate: 38 },
    { name: 'Confirmation Reminder #2', description: 'If still no reply after 4 hours, send second reminder.', trigger: 'ORDER_PENDING_4H', triggerLabel: 'No reply 4 hours', conditions: ['Order status = UNCONFIRMED', 'No customer reply in 4 hours'], actions: ['Send WhatsApp reminder #2', 'Flag for manual call review'], enabled: true, runsLast30Days: 248, successRate: 22 },
    { name: 'Auto-Confirm on Customer Reply', description: 'When customer replies CONFIRM, automatically move order to Confirmed stage.', trigger: 'CUSTOMER_MESSAGE_RECEIVED', triggerLabel: 'Customer replied', conditions: ["Message body matches 'CONFIRM'", 'Order status = UNCONFIRMED'], actions: ['Set order status = CONFIRMED', 'Notify operator', "Trigger 'Create Shipment' suggestion"], enabled: true, runsLast30Days: 1248, successRate: 100 },
    { name: 'Auto-Cancel on CANCEL Reply', description: 'When customer replies CANCEL, cancel the order and notify merchant.', trigger: 'CUSTOMER_MESSAGE_RECEIVED', triggerLabel: 'Customer replied', conditions: ["Message body matches 'CANCEL'", 'Order status = UNCONFIRMED'], actions: ['Set order status = CANCELLED', 'Notify operator', 'Log reason'], enabled: true, runsLast30Days: 184, successRate: 100 },
    { name: 'AI Risk Check on High-Value COD', description: 'Run AI risk analysis on COD orders above Rs 10,000 before dispatch.', trigger: 'ORDER_CONFIRMED', triggerLabel: 'Order confirmed', conditions: ['COD amount >= 10,000', 'Customer risk score > 50 OR new customer'], actions: ['Run AI risk analysis', 'Flag for manual review if HIGH risk', 'Hold shipment creation'], enabled: true, runsLast30Days: 92, successRate: 100 },
    { name: 'Needs Attention Auto-Triage', description: 'When courier reports an exception, create Attention case with AI classification.', trigger: 'DELIVERY_FAILED', triggerLabel: 'Delivery failed', conditions: ['Courier event = failed/exception'], actions: ['Create Attention case', 'Run AI classification', 'Send recovery WhatsApp to customer'], enabled: true, runsLast30Days: 78, successRate: 96 },
    { name: 'Out-for-Delivery Customer Alert', description: 'Notify customer on WhatsApp when shipment is out for delivery.', trigger: 'SHIPMENT_OUT_FOR_DELIVERY', triggerLabel: 'Out for delivery', conditions: ['Shipment status = OUT_FOR_DELIVERY'], actions: ["Send WhatsApp 'out_for_delivery' template"], enabled: true, runsLast30Days: 1684, successRate: 99 },
    { name: 'Delivered — Request Review', description: '24 hours after delivery, send WhatsApp review request.', trigger: 'ORDER_DELIVERED_24H', triggerLabel: 'Delivered +24h', conditions: ['Order status = DELIVERED', '24 hours since delivery'], actions: ['Send WhatsApp review request', 'Apply discount coupon if low rating'], enabled: false, runsLast30Days: 0, successRate: 0 },
    { name: 'RTO Evidence Bundle', description: 'When RTO initiated, automatically collect all evidence into a single bundle for dispute.', trigger: 'RETURN_CREATED', triggerLabel: 'Return initiated', conditions: ['Return status = initiated'], actions: ['Compile evidence timeline', 'Generate dispute PDF', 'Notify ops team'], enabled: true, runsLast30Days: 24, successRate: 100 },
  ]
  for (const a of automations) {
    await db.automationRule.create({
      data: {
        organizationId: org.id,
        name: a.name,
        description: a.description,
        trigger: a.trigger,
        triggerLabel: a.triggerLabel,
        conditions: JSON.stringify(a.conditions),
        actions: JSON.stringify(a.actions),
        enabled: a.enabled,
        runsLast30Days: a.runsLast30Days,
        successRate: a.successRate,
        lastRunAt: a.runsLast30Days > 0 ? new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000) : null,
      },
    })
  }

  console.log('✅ Seed completed successfully!')
  console.log(`   Organization: ${org.name} (${org.slug})`)
  console.log(`   Users: 5 (1 owner, 1 admin, 1 manager, 2 operators) + 1 invitation`)
  console.log(`   Store: ${store.name}`)
  console.log(`   Couriers: ${couriers.length}`)
  console.log(`   Products: ${products.length}`)
  console.log(`   Customers: ${customerData.length}`)
  console.log(`   Orders: 12 (across all lifecycle stages)`)
  console.log(`   Attention cases: ${attentionCases.length}`)
  console.log(`   Automation rules: ${automations.length}`)
  console.log('')
  console.log('🔐 Demo login:')
  console.log('   Email:    hamza@demostore.pk')
  console.log('   Password: demo1234')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
