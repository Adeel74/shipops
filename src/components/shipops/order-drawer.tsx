"use client";

import { X, MapPin, Phone, Package, Clock, CheckCircle2, AlertTriangle, Sparkles, MessageCircle, Banknote, Truck, FileText, User, Bot } from "lucide-react";
import type { Order } from "@/lib/types";
import { formatPKRFull, formatDateTime, formatTimeAgo, orderStatusConfig } from "@/lib/format";
import { StatusBadge, RiskBadge, RiskMeter, CourierTag } from "./shared";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface OrderDrawerProps {
  order: Order | null;
  onClose: () => void;
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

export function OrderDrawer({ order, onClose }: OrderDrawerProps) {
  const { toast } = useToast();

  if (!order) return null;

  const handleAction = (action: string) => {
    toast({ title: action, description: `${order.orderNumber} · ${order.customerName}` });
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
                <h2 className="text-lg font-bold">{order.orderNumber}</h2>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-muted-foreground">{order.customerName} · {order.city}</p>
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
              <p className="text-2xl font-bold">{formatPKRFull(order.codAmount)}</p>
              <p className="text-xs text-muted-foreground">+ {formatPKRFull(order.shippingFee)} shipping</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5" /> RTO Risk
              </div>
              <RiskMeter score={order.riskScore} />
              <div className="mt-1.5"><RiskBadge level={order.riskLevel} /></div>
            </div>
          </div>

          {/* Customer */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold">{order.customerName}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{order.customerPhone}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{order.city}</p>
                <p className="mt-0.5 text-xs">{order.address}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items ({order.items.length})</p>
            <div className="space-y-2">
              {order.items.map((item) => (
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
          {order.shipment && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shipment Timeline</p>
                {order.courier && <CourierTag courier={order.courier} />}
              </div>
              <p className="mb-3 font-mono text-xs text-muted-foreground">Tracking: {order.trackingNumber}</p>
              <div className="relative">
                <div className="absolute bottom-4 left-[15px] top-4 w-0.5 bg-border" />
                <div className="space-y-4">
                  {[...order.shipment.events].reverse().map((ev, idx) => {
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
          {order.recommendedAction && (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700">
                <Sparkles className="h-3.5 w-3.5" /> AI Recommendation
              </p>
              <p className="text-sm text-violet-900">{order.recommendedAction}</p>
            </div>
          )}

          {/* Attention info */}
          {order.attentionType && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" /> Attention Required
              </p>
              <p className="text-sm font-semibold text-amber-900">{order.attentionReason}</p>
              <div className="mt-2 flex gap-3 text-xs text-amber-700">
                <span>⏱ {order.attentionOverdueHours}h overdue</span>
                {order.attentionAttemptsLeft !== undefined && <span>📦 {order.attentionAttemptsLeft} attempts left</span>}
              </div>
            </div>
          )}

          {/* Evidence (if RTO) */}
          {order.evidence && order.evidence.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence ({order.evidence.length})</p>
              <div className="space-y-2">
                {order.evidence.map((ev) => {
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
              <p className="text-sm font-medium">{formatDateTime(order.createdAt)}</p>
            </div>
            {order.confirmedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Confirmed</p>
                <p className="text-sm font-medium">{formatDateTime(order.confirmedAt)}</p>
              </div>
            )}
            {order.confirmationMethod && (
              <div>
                <p className="text-xs text-muted-foreground">Confirmation</p>
                <p className="text-sm font-medium">{order.confirmationMethod}</p>
              </div>
            )}
            {order.returnReason && (
              <div>
                <p className="text-xs text-muted-foreground">Return Reason</p>
                <p className="text-sm font-medium text-rose-600">{order.returnReason}</p>
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
