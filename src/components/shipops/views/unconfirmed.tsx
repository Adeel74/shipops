"use client";

import { useState } from "react";
import { MessageCircle, Phone, Mail, Check, X, Eye, MapPin, Package, AlertTriangle, Sparkles, Clock, Filter } from "lucide-react";
import { orders } from "@/lib/mock-data";
import { formatPKRFull, formatTimeAgo, riskLevelConfig } from "@/lib/format";
import { PageContainer, RiskBadge, RiskMeter, SectionCard, EmptyState } from "../shared";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/lib/types";

export function UnconfirmedView() {
  const { toast } = useToast();
  const unconfirmed = orders.filter((o) => o.status === "UNCONFIRMED");
  const [selected, setSelected] = useState<Order | null>(unconfirmed[0] || null);
  const [filter, setFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [confirming, setConfirming] = useState<Set<string>>(new Set());

  const filtered = unconfirmed.filter((o) => filter === "ALL" || o.riskLevel === filter);

  const handleAction = (order: Order, action: "whatsapp" | "call" | "sms" | "confirm" | "cancel") => {
    if (action === "confirm" || action === "cancel") {
      setConfirming((prev) => new Set(prev).add(order.id));
    }
    const messages = {
      whatsapp: `WhatsApp confirmation sent to ${order.customerName}`,
      call: `Initiating call to ${order.customerPhone}...`,
      sms: `SMS reminder sent to ${order.customerName}`,
      confirm: `Order ${order.orderNumber} confirmed ✓`,
      cancel: `Order ${order.orderNumber} cancelled`,
    };
    toast({ title: messages[action], description: action === "confirm" ? "Moved to Confirmed stage" : undefined });
  };

  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Order list */}
        <div className="lg:col-span-2 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">{unconfirmed.length} to confirm</p>
            <div className="flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium",
                    filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {f === "ALL" ? "All" : f === "HIGH" ? "High" : f === "MEDIUM" ? "Med" : "Low"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1">
            {filtered.length === 0 ? (
              <EmptyState icon={Check} title="All caught up!" description="No unconfirmed orders in this filter." />
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className={cn(
                    "w-full rounded-xl border bg-card p-3.5 text-left transition-all hover:shadow-sm",
                    selected?.id === o.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                  )}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.orderNumber} · {o.city}</p>
                    </div>
                    <RiskBadge level={o.riskLevel} score={o.riskScore} />
                  </div>
                  <div className="mb-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    <span className="truncate">{o.items[0]?.title}</span>
                    {o.items.length > 1 && <span className="shrink-0">+{o.items.length - 1}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{formatPKRFull(o.codAmount)}</span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(o.createdAt)}
                    </span>
                  </div>
                  {o.confirmationMethod && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {o.confirmationMethod === "AUTO_CALL" && <Phone className="h-3 w-3" />}
                      {o.confirmationMethod === "WHATSAPP" && <MessageCircle className="h-3 w-3" />}
                      Auto-call: Pressed 1
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3 xl:col-span-3">
          {selected ? (
            <div className="space-y-4">
              {/* Customer + order details */}
              <SectionCard>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">{selected.customerName}</h2>
                      <RiskBadge level={selected.riskLevel} />
                    </div>
                    <p className="text-sm text-muted-foreground">{selected.orderNumber} · COD · {formatTimeAgo(selected.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatPKRFull(selected.codAmount)}</p>
                    <p className="text-xs text-muted-foreground">Cash on Delivery</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{selected.customerPhone}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">City</p>
                    <p className="flex items-center gap-1.5 text-sm font-medium"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{selected.city}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3 sm:col-span-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Shipping Address</p>
                    <p className="text-sm">{selected.address}</p>
                  </div>
                </div>
              </SectionCard>

              {/* Items */}
              <SectionCard title="Order Items" description={`${selected.items.length} item(s)`}>
                <div className="space-y-2">
                  {selected.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
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
              </SectionCard>

              {/* AI Risk analysis */}
              {selected.riskLevel !== "LOW" && (
                <SectionCard
                  title="AI Risk Analysis"
                  description="Automated risk assessment before dispatch"
                  action={<Sparkles className="h-4 w-4 text-violet-500" />}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-violet-50 p-3">
                      <div>
                        <p className="text-sm font-semibold text-violet-900">RTO Risk Score</p>
                        <p className="text-xs text-violet-700/70">Higher = more likely to return</p>
                      </div>
                      <RiskMeter score={selected.riskScore} />
                    </div>
                    {selected.riskReasons && selected.riskReasons.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Factors</p>
                        <ul className="space-y-1.5">
                          {selected.riskReasons.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selected.recommendedAction && (
                      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-violet-900">
                          <Sparkles className="h-3.5 w-3.5" />
                          AI Recommendation
                        </p>
                        <p className="text-sm text-violet-800">{selected.recommendedAction}</p>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* Confirmation actions */}
              <SectionCard title="Confirmation" description="Choose how to verify with customer">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button
                    onClick={() => handleAction(selected, "whatsapp")}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleAction(selected, "call")}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 p-3 hover:bg-sky-100 transition-colors"
                  >
                    <Phone className="h-5 w-5 text-sky-600" />
                    <span className="text-xs font-semibold text-sky-700">Call</span>
                  </button>
                  <button
                    onClick={() => handleAction(selected, "sms")}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 p-3 hover:bg-violet-100 transition-colors"
                  >
                    <Mail className="h-5 w-5 text-violet-600" />
                    <span className="text-xs font-semibold text-violet-700">SMS</span>
                  </button>
                  <button
                    onClick={() => handleAction(selected, "confirm")}
                    disabled={confirming.has(selected.id)}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-500 p-3 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    <Check className="h-5 w-5" />
                    <span className="text-xs font-semibold">{confirming.has(selected.id) ? "Confirmed" : "Confirm"}</span>
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleAction(selected, "cancel")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Cancel Order
                  </button>
                  <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/40 py-2 text-sm font-medium hover:bg-muted transition-colors">
                    <Eye className="h-4 w-4" />
                    View in Shopify
                  </button>
                </div>
              </SectionCard>
            </div>
          ) : (
            <EmptyState icon={Inbox} title="Select an order" description="Choose an unconfirmed order from the left to view details and confirm." />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
