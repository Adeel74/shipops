// ShipOps — Core domain types

export type OrderStatus =
  | "UNCONFIRMED"
  | "CONFIRMED"
  | "SHIPMENT_CREATED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "ATTENTION"
  | "RETURNING"
  | "RETURNED"
  | "CANCELLED";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type AttentionType =
  | "BAD_ADDRESS"
  | "CUSTOMER_UNREACHABLE"
  | "CUSTOMER_REFUSED"
  | "FAILED_DELIVERY"
  | "COURIER_DELAY"
  | "HIGH_RTO_RISK"
  | "PAYMENT_ISSUE"
  | "DUPLICATE_ORDER";

export type AttentionStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "IGNORED";

export type ConfirmationMethod = "WHATSAPP" | "CALL" | "SMS" | "MANUAL" | "AUTO_CALL";

export type CourierProvider = "TCS" | "LEOPARDS" | "M&P" | "TRAX" | "POSTEX" | "CALL_COURIER" | "RIDER";

export type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER";

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  totalOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  riskScore: number;
  riskLevel: RiskLevel;
  lastOrderAmount?: number;
  joinedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  title: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface TrackingEvent {
  id: string;
  status: string;
  eventCode?: string;
  description: string;
  location?: string;
  eventTime: string;
  source: "COURIER" | "SHIPOPS" | "CUSTOMER" | "AI";
  isWarning?: boolean;
}

export interface EvidenceItem {
  id: string;
  type: "COURIER_EVENT" | "WHATSAPP" | "CALL_LOG" | "CUSTOMER_REPLY" | "AGENT_ACTION" | "TIMESTAMP";
  title: string;
  detail: string;
  timestamp: string;
  source: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  courier: CourierProvider;
  status: string;
  shippingCost: number;
  codAmount: number;
  shippedAt: string;
  deliveredAt?: string;
  events: TrackingEvent[];
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  items: OrderItem[];
  codAmount: number;
  shippingFee: number;
  totalAmount: number;
  isCod: boolean;
  status: OrderStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  riskReasons?: string[];
  confirmationMethod?: ConfirmationMethod;
  confirmedAt?: string;
  courier?: CourierProvider;
  trackingNumber?: string;
  shipment?: Shipment;
  attentionType?: AttentionType;
  attentionReason?: string;
  attentionOverdueHours?: number;
  attentionAttemptsLeft?: number;
  returnReason?: string;
  evidence?: EvidenceItem[];
  createdAt: string;
  recommendedAction?: string;
}

export interface AttentionCase {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  city: string;
  type: AttentionType;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: AttentionStatus;
  overdueHours: number;
  attemptsLeft?: number;
  recommendedAction: string;
  aiConfidence: number;
  createdAt: string;
}

export interface WhatsAppConversation {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  orderNumber?: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "AWAITING_REPLY" | "RESOLVED";
  messages: WhatsAppMessage[];
}

export interface WhatsAppMessage {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string;
  timestamp: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  isAutomated?: boolean;
}

export interface CourierIntegration {
  id: string;
  provider: CourierProvider;
  displayName: string;
  accountName: string;
  accountNumber?: string;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  connectedAt?: string;
  shipmentsCount: number;
  deliveryRate: number;
  avgCost: number;
  logoColor: string;
  description: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  triggerLabel: string;
  conditions: string[];
  actions: string[];
  enabled: boolean;
  runsLast30Days: number;
  successRate: number;
  lastRunAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  lastActiveAt: string;
  avatarColor: string;
}

export interface DashboardMetrics {
  inTransit: number;
  delivered: number;
  deliveryRate: number;
  inYourBank: number;
  courierOwes: number;
  shippingCost: number;
  taxWithheld: number;
  todaysOrders: number;
  pendingConfirmation: number;
  confirmed: number;
  rto: number;
  rtoRate: number;
  codCollected: number;
  courierPayable: number;
  courierReceivable: number;
  avgDeliveryTime: number;
}

export type ViewKey =
  | "dashboard"
  | "unconfirmed"
  | "confirmed"
  | "tracking"
  | "attention"
  | "returns"
  | "customers"
  | "whatsapp"
  | "couriers"
  | "automation"
  | "analytics"
  | "ai"
  | "settings"
  | "billing"
  | "team";
