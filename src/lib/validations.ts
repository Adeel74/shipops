// ShipOps — Zod validation schemas for API request bodies

import { z } from 'zod'

// ============================================================
// Auth
// ============================================================
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationName: z.string().min(2, 'Organization name required'),
})

// ============================================================
// Orders
// ============================================================
export const confirmOrderSchema = z.object({
  method: z.enum(['WHATSAPP', 'CALL', 'SMS', 'MANUAL', 'AUTO_CALL']).optional(),
})

export const cancelOrderSchema = z.object({
  reason: z.string().max(500).optional(),
})

export const createShipmentSchema = z.object({
  courierAccountId: z.string().min(1, 'courierAccountId is required'),
})

export const updateOrderSchema = z.object({
  status: z.enum([
    'UNCONFIRMED', 'CONFIRMED', 'SHIPMENT_CREATED', 'IN_TRANSIT',
    'OUT_FOR_DELIVERY', 'DELIVERED', 'ATTENTION', 'RETURNING', 'RETURNED', 'CANCELLED'
  ]).optional(),
  confirmedAt: z.string().nullable().optional(),
  attentionType: z.string().nullable().optional(),
  attentionReason: z.string().nullable().optional(),
})

// ============================================================
// WhatsApp
// ============================================================
export const sendWhatsAppSchema = z.object({
  customerId: z.string().min(1, 'customerId is required'),
  orderId: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(4096),
})

// ============================================================
// Shopify
// ============================================================
export const connectShopifySchema = z.object({
  shopDomain: z.string().min(1, 'Shop domain required').regex(
    /\.myshopify\.com$/,
    'Domain must end with .myshopify.com'
  ),
  accessToken: z.string().optional(),
})

export const simulateOrderSchema = z.object({
  order_number: z.number().optional(),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  city: z.string().optional(),
  product_title: z.string().optional(),
  price: z.number().optional(),
  qty: z.number().optional(),
}).optional()

// ============================================================
// Attention
// ============================================================
export const resolveAttentionSchema = z.object({
  resolution: z.string().max(500).optional(),
})

// ============================================================
// Team
// ============================================================
export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']),
})

// ============================================================
// Automation
// ============================================================
export const createAutomationSchema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().optional(),
  trigger: z.string().min(1, 'Trigger required'),
  triggerLabel: z.string().min(1, 'Trigger label required'),
  conditions: z.array(z.string()),
  actions: z.array(z.string()),
  enabled: z.boolean().optional(),
})

// ============================================================
// Helper: parse + validate body
// ============================================================
export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body)
  if (result.success) return { success: true, data: result.data }
  return { success: false, error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ') }
}
