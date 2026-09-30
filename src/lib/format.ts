import type { OrderStatus, RiskLevel, AttentionType } from "./types";

export function formatPKR(amount: number): string {
  if (amount >= 1_000_000) {
    return `Rs ${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `Rs ${(amount / 1_000).toFixed(1)}K`;
  }
  return `Rs ${amount.toLocaleString("en-PK")}`;
}

export function formatPKRFull(amount: number): string {
  return `Rs ${amount.toLocaleString("en-PK")}`;
}

export function formatTimeAgo(iso: string): string {
  const now = new Date("2026-10-01T09:35:00").getTime();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const orderStatusConfig: Record<
  OrderStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  UNCONFIRMED: { label: "Unconfirmed", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  CONFIRMED: { label: "Confirmed", color: "text-sky-700", bg: "bg-sky-50 border-sky-200", dot: "bg-sky-500" },
  SHIPMENT_CREATED: { label: "Shipment Created", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", dot: "bg-violet-500" },
  IN_TRANSIT: { label: "In Transit", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", dot: "bg-indigo-500" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", dot: "bg-blue-500" },
  DELIVERED: { label: "Delivered", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  ATTENTION: { label: "Needs Attention", color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-500" },
  RETURNING: { label: "Returning", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-500" },
  RETURNED: { label: "Returned (RTO)", color: "text-rose-700", bg: "bg-rose-50 border-rose-200", dot: "bg-rose-500" },
  CANCELLED: { label: "Cancelled", color: "text-zinc-600", bg: "bg-zinc-50 border-zinc-200", dot: "bg-zinc-400" },
};

export const riskLevelConfig: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  LOW: { label: "Low Risk", color: "text-emerald-700", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  MEDIUM: { label: "Medium Risk", color: "text-amber-700", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  HIGH: { label: "High Risk", color: "text-red-700", bg: "bg-red-50 text-red-700 border-red-200" },
};

export const attentionTypeConfig: Record<AttentionType, { label: string; icon: string }> = {
  BAD_ADDRESS: { label: "Bad Address", icon: "MapPinOff" },
  CUSTOMER_UNREACHABLE: { label: "Customer Unreachable", icon: "PhoneOff" },
  CUSTOMER_REFUSED: { label: "Customer Refused", icon: "UserX" },
  FAILED_DELIVERY: { label: "Failed Delivery", icon: "PackageX" },
  COURIER_DELAY: { label: "Courier Delay", icon: "Clock" },
  HIGH_RTO_RISK: { label: "High RTO Risk", icon: "AlertTriangle" },
  PAYMENT_ISSUE: { label: "Payment Issue", icon: "CreditCard" },
  DUPLICATE_ORDER: { label: "Duplicate Order", icon: "Copy" },
};

export const courierConfig: Record<string, { label: string; color: string }> = {
  TCS: { label: "TCS", color: "#E63946" },
  LEOPARDS: { label: "Leopards", color: "#F4A261" },
  "M&P": { label: "M&P", color: "#6A4C93" },
  TRAX: { label: "Trax", color: "#2A9D8F" },
  POSTEX: { label: "PostEx", color: "#1D3557" },
  CALL_COURIER: { label: "Call Courier", color: "#457B9D" },
  RIDER: { label: "Rider", color: "#8D99AE" },
};

export const userRoleConfig: Record<string, { label: string; color: string }> = {
  OWNER: { label: "Owner", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  ADMIN: { label: "Admin", color: "bg-sky-100 text-sky-800 border-sky-200" },
  MANAGER: { label: "Manager", color: "bg-violet-100 text-violet-800 border-violet-200" },
  OPERATOR: { label: "Operator", color: "bg-amber-100 text-amber-800 border-amber-200" },
  VIEWER: { label: "Viewer", color: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};
