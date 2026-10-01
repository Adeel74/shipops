"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Phone, Package, Clock, CheckCircle2, AlertTriangle, Sparkles, MessageCircle, Banknote, Truck, FileText, User, Bot, Loader2 } from "lucide-react";
import type { Order, EvidenceItem } from "@/lib/types";
import { formatPKRFull, formatDateTime, formatTimeAgo, orderStatusConfig } from "@/lib/format";
import { StatusBadge, RiskBadge, RiskMeter, CourierTag } from "./shared";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface OrderDrawerProps {
  order: Order | null;
  orderId?: string | null;
  onClose: () => void;
}

// API response shape for order detail
interface ApiOrderDetail {
  order: {
    id: string;
    orderNumber: string;
    customer: {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      riskScore: number;
      riskLevel: string;
      totalOrders: number;
      deliveredOrders: number;
      returnedOrders: number;
    };
    addresses: Array<{ id: string; addressLine1: string | null; city: string | null; isDefault: boolean }>;
    items: Array<{ id: string; title: string; sku: string | null; quantity: number; unitPrice: number; totalPrice: number }>;
    status: string;
    riskScore: number;
    riskLevel: string;
    codAmount: number;
    shippingFee: number;
    totalAmount: number;
    isCod: boolean;
    confirmationMethod: string | null;
    confirmedAt: string | null;
    courier: string | null;
    trackingNumber: string | null;
    attentionType: string | null;
    attentionReason: string | null;
    returnReason: string | null;
    recommendedAction: string | null;
    createdAt: string;
    shipment: {
      id: string;
      trackingNumber: string;
      status: string;
      shippingCost: number | null;
      codAmount: number | null;
      shippedAt: string | null;
      deliveredAt: string | null;
      events: Array<{
        id: string;
        status: string;
        description: string | null;
        location: string | null;
        eventTime: string;
        source: string;
        isWarning: boolean;
      }>;
    } | null;
    evidence: Array<{
      id: string;
      type: string;
      title: string;
      detail: string;
      timestamp: string;
      source: string;
    }>;
    statusHistory: Array<{
      id: string;
      oldStatus: string | null;
      newStatus: string;
      reason: string | null;
      source: string | null;
      createdAt: string;
    }>;
  };
}

const evidenceIcons = {
  COURIER_EVENT: Package,
  WHATSAPP: MessageCircle,
  CALL_LOG: Phone,
  CUSTOMER_REPLY: User,
  AGENT_ACTION: Bot,
  TIMESTAMP: FileText,
};

const evidenceColors = {
  COURIER_EVENT: { bg: "bg-orange-500", chip: "bg-orange-100 text-orange-700" },
  WHATSAPP: { bg: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-700" },
  CALL_LOG: { bg: "bg-sky-500", chip: "bg-sky-100 text-sky-700" },
  CUSTOMER_REPLY: { bg: "bg-violet-500", chip: "bg-violet-100 text-violet-700" },
  AGENT_ACTION: { bg: "bg-zinc-600", chip: "bg-zinc-100 text-zinc-700" },
  TIMESTAMP: { bg: "bg-muted-foreground", chip: "bg-muted text-muted-foreground" },
};

export function OrderDrawer({ order, orderId, onClose }: OrderDrawerProps) {
  const { toast } = useToast();
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  // If orderId provided (from search), fetch full order detail
  useEffect(() => {
    if (!orderId) {
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/v1/orders/${orderId}`)
      .then((r) => r.json())
      .then((json: { success: boolean; data?: ApiOrderDetail; error?: { message: string } }) => {
        if (json.success && json.data) {
          const o = json.data.order;
          // Map API response to the Order shape the drawer expects
          const defaultAddr = o.addresses.find((a) => a.isDefault) || o.addresses[0];
          const mapped: Order = {
            id: o.id,
            orderNumber: o.orderNumber,
            customerId: o.customer.id,
            customerName: o.customer.name,
            customerPhone: o.customer.phone || '',
            city: defaultAddr?.city || '',
            address: defaultAddr?.addressLine1 || '',
            items: o.items.map((i) => ({
              id: i.id,
              productId: '',
              title: i.title,
              sku: i.sku || undefined,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
            })),
            codAmount: o.codAmount,
            shippingFee: o.shippingFee,
            totalAmount: o.totalAmount,
            isCod: o.isCod,
            status: o.status as Order["status"],
            riskScore: o.riskScore,
            riskLevel: o.riskLevel as Order["riskLevel"],
            confirmationMethod: (o.confirmationMethod || undefined) as Order["confirmationMethod"],
            confirmedAt: o.confirmedAt || undefined,
            courier: (o.courier || undefined) as Order["courier"],
            trackingNumber: o.trackingNumber || undefined,
            attentionType: (o.attentionType || undefined) as Order["attentionType"],
            attentionReason: o.attentionReason || undefined,
            returnReason: o.returnReason || undefined,
            recommendedAction: o.recommendedAction || undefined,
            evidence: o.evidence.map((e) => ({
              id: e.id,
              type: e.type as EvidenceItem["type"],
              title: e.title,
              detail: e.detail,
              timestamp: e.timestamp,
              source: e.source,
            })),
            shipment: o.shipment
              ? {
                  id: o.shipment.id,
                  trackingNumber: o.shipment.trackingNumber,
                  courier: (o.courier || '') as Order["courier"],
                  status: o.shipment.status,
                  shippingCost: o.shipment.shippingCost || 0,
                  codAmount: o.shipment.codAmount || 0,
                  shippedAt: o.shipment.shippedAt || '',
                  events: o.shipment.events.map((e) => ({
                    id: e.id,
                    status: e.status,
                    description: e.description || '',
                    location: e.location || undefined,
                    eventTime: e.eventTime,
                    source: e.source as "COURIER" | "SHIPOPS" | "AI" | "CUSTOMER",
                    isWarning: e.isWarning,
                  })),
                }
              : undefined,
            createdAt: o.createdAt,
          };
          setFetchedOrder(mapped);
        }
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  // Use provided order or fetched order
  const currentOrder = order || fetchedOrder;

  if (!currentOrder && !loading && !orderId) return null;
  if (loading) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
        <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-background shadow-2xl">
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading order...</p>
            </div>
          </div>
        </aside>
      </>
    );
  }
  if (!currentOrder) return null;

  const handleAction = async (action: string) => {
    if (action === "Order confirmed") {
      const res = await fetch(`/api/v1/orders/${currentOrder.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "MANUAL" }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: `Order ${currentOrder.orderNumber} confirmed ✓`, description: "Moved to Confirmed stage" });
      } else {
        toast({ title: "Failed to confirm", description: json.error?.message, variant: "destructive" });
      }
      return;
    }
    toast({ title: action, description: `${currentOrder.orderNumber} · ${currentOrder.customerName}` });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{currentOrder.orderNumber}</h2>
                <StatusBadge status={currentOrder.status} />
              </div>
              <p className="text-xs text-muted-foreground">{currentOrder.customerName} · {currentOrder.city}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-muted" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Amount + Risk */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Banknote className="h-3.5 w-3.5" /> COD Amount
              </div>
              <p className="text-2xl font-bold">{formatPKRFull(currentOrder.codAmount)}</p>
              <p className="text-xs text-muted-foreground">+ {formatPKRFull(currentOrder.shippingFee)} shipping</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5" /> RTO Risk
              </div>
              <RiskMeter score={currentOrder.riskScore} />
              <div className="mt-1.5"><RiskBadge level={currentOrder.riskLevel} /></div>
            </div>
          </div>

          {/* Customer */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold">{currentOrder.customerName}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{currentOrder.customerPhone}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{currentOrder.city}</p>
                <p className="mt-0.5 text-xs">{currentOrder.address}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items ({currentOrder.items.length})</p>
            <div className="space-y-2">
              {currentOrder.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.sku} · Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatPKRFull(item.totalPrice)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipment timeline */}
          {currentOrder.shipment && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shipment Timeline</p>
                {currentOrder.courier && <CourierTag courier={currentOrder.courier} />}
              </div>
              <p className="mb-3 font-mono text-xs text-muted-foreground">Tracking: {currentOrder.trackingNumber}</p>
              <div className="relative">
                <div className="absolute bottom-4 left-[15px] top-4 w-0.5 bg-border" />
                <div className="space-y-4">
                  {[...currentOrder.shipment.events].reverse().map((ev, idx) => {
                    const isLast = idx === 0;
                    return (
                      <div key={ev.id} className="relative flex gap-4">
                        <div className={cn(
                          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
                          ev.isWarning ? "bg-amber-500" : isLast ? "bg-primary" : "bg-emerald-500"
                        )}>
                          {ev.isWarning ? <AlertTriangle className="h-3.5 w-3.5 text-white" /> :
                           isLast ? <Truck className="h-3.5 w-3.5 text-white" /> :
                           <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className={cn("text-sm font-semibold", ev.isWarning && "text-amber-700")}>{ev.status}</p>
                          <p className="text-sm text-muted-foreground">{ev.description}</p>
                          {ev.location && <p className="text-xs text-muted-foreground">📍 {ev.location}</p>}
                          <div className="mt-1 flex items-center gap-2">
                            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium",
                              ev.source === "COURIER" && "bg-orange-100 text-orange-700",
                              ev.source === "SHIPOPS" && "bg-teal-100 text-teal-700",
                              ev.source === "AI" && "bg-violet-100 text-violet-700",
                              ev.source === "CUSTOMER" && "bg-sky-100 text-sky-700"
                            )}>{ev.source}</span>
                            <span className="text-[10px] text-muted-foreground">{formatDateTime(ev.eventTime)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* AI Recommendation */}
          {currentOrder.recommendedAction && (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700">
                <Sparkles className="h-3.5 w-3.5" /> AI Recommendation
              </p>
              <p className="text-sm text-violet-900">{currentOrder.recommendedAction}</p>
            </div>
          )}

          {/* Attention info */}
          {currentOrder.attentionType && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" /> Attention Required
              </p>
              <p className="text-sm font-semibold text-amber-900">{currentOrder.attentionReason}</p>
              <div className="mt-2 flex gap-3 text-xs text-amber-700">
                <span>⏱ {currentOrder.attentionOverdueHours}h overdue</span>
                {currentOrder.attentionAttemptsLeft !== undefined && <span>📦 {currentOrder.attentionAttemptsLeft} attempts left</span>}
              </div>
            </div>
          )}

          {/* Evidence (if RTO) */}
          {currentOrder.evidence && currentOrder.evidence.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence ({currentOrder.evidence.length})</p>
              <div className="space-y-2">
                {currentOrder.evidence.map((ev) => {
                  const Icon = evidenceIcons[ev.type as keyof typeof evidenceIcons] || FileText;
                  const colors = evidenceColors[ev.type as keyof typeof evidenceColors] || evidenceColors.TIMESTAMP;
                  return (
                    <div key={ev.id} className="flex gap-3 rounded-lg border border-border p-2.5">
                      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white", colors.bg)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{ev.detail}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", colors.chip)}>{ev.type.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-muted-foreground">{formatTimeAgo(ev.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4">
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm font-medium">{formatDateTime(currentOrder.createdAt)}</p>
            </div>
            {currentOrder.confirmedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Confirmed</p>
                <p className="text-sm font-medium">{formatDateTime(currentOrder.confirmedAt)}</p>
              </div>
            )}
            {currentOrder.confirmationMethod && (
              <div>
                <p className="text-xs text-muted-foreground">Confirmation</p>
                <p className="text-sm font-medium">{currentOrder.confirmationMethod}</p>
              </div>
            )}
            {currentOrder.returnReason && (
              <div>
                <p className="text-xs text-muted-foreground">Return Reason</p>
                <p className="text-sm font-medium text-rose-600">{currentOrder.returnReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-border bg-muted/20 p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              onClick={() => handleAction("WhatsApp sent")}
              className="flex flex-col items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 hover:bg-emerald-100"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-[11px] font-semibold text-emerald-700">WhatsApp</span>
            </button>
            <button
              onClick={() => handleAction("Call initiated")}
              className="flex flex-col items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 p-2.5 hover:bg-sky-100"
            >
              <Phone className="h-4 w-4 text-sky-600" />
              <span className="text-[11px] font-semibold text-sky-700">Call</span>
            </button>
            <button
              onClick={() => handleAction("Order confirmed")}
              className="flex flex-col items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-500 p-2.5 text-white hover:bg-emerald-600"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-[11px] font-semibold">Confirm</span>
            </button>
            {currentOrder.trackingNumber && (
              <a
                href={`/track/${currentOrder.trackingNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 hover:bg-indigo-100"
              >
                <Truck className="h-4 w-4 text-indigo-600" />
                <span className="text-[11px] font-semibold text-indigo-700">Track</span>
              </a>
            )}
            <button
              onClick={() => handleAction("View in Shopify")}
              className="flex flex-col items-center gap-1 rounded-lg border border-border bg-background p-2.5 hover:bg-muted"
            >
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-[11px] font-semibold">Shopify</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
