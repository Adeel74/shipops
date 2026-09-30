"use client";

import { useState } from "react";
import { Undo2, FileText, MessageCircle, Phone, User, Bot, AlertTriangle, Download, ArrowRight, Package } from "lucide-react";
import { orders } from "@/lib/mock-data";
import { formatPKRFull, formatDateTime, formatTimeAgo } from "@/lib/format";
import { PageContainer, SectionCard, EmptyState, StatusBadge, CourierTag } from "../shared";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Order, EvidenceItem } from "@/lib/types";

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

export function ReturnsView() {
  const { toast } = useToast();
  const returns = orders.filter((o) => o.status === "RETURNING" || o.status === "RETURNED");
  const [selected, setSelected] = useState<Order | null>(returns[0] || null);

  return (
    <PageContainer>
      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active RTOs", value: returns.filter((r) => r.status === "RETURNING").length, color: "text-orange-600" },
          { label: "Completed RTOs", value: returns.filter((r) => r.status === "RETURNED").length, color: "text-rose-600" },
          { label: "Value at Risk", value: formatPKRFull(returns.reduce((s, r) => s + r.codAmount, 0)), color: "text-red-600" },
          { label: "Evidence Bundles", value: returns.filter((r) => r.evidence && r.evidence.length > 0).length, color: "text-violet-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3">
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* List */}
        <div className="lg:col-span-2">
          <p className="mb-3 text-sm font-semibold">{returns.length} RTO cases</p>
          <div className="space-y-2 lg:max-h-[calc(100vh-18rem)] lg:overflow-y-auto lg:pr-1">
            {returns.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelected(o)}
                className={cn(
                  "w-full rounded-xl border bg-card p-3.5 text-left transition-all hover:shadow-sm",
                  selected?.id === o.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{o.customerName}</p>
                    <p className="text-xs text-muted-foreground">{o.orderNumber} · {o.city}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-600">{formatPKRFull(o.codAmount)}</span>
                  <span className="text-muted-foreground">{o.evidence?.length || 0} evidence items</span>
                </div>
                {o.returnReason && (
                  <div className="mt-2 rounded bg-orange-50 px-2 py-1 text-[11px] text-orange-700">
                    Reason: {o.returnReason}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="space-y-4">
              {/* Header */}
              <SectionCard>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">{selected.customerName}</h2>
                      {selected.courier && <CourierTag courier={selected.courier} />}
                    </div>
                    <p className="text-sm text-muted-foreground">{selected.orderNumber} · {selected.city}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{selected.trackingNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Return Status</p>
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
                {selected.returnReason && (
                  <div className="mt-4 flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Return Reason</p>
                      <p className="text-sm text-orange-900">{selected.returnReason}</p>
                    </div>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <div className="rounded-lg border border-border bg-muted/20 px-3 py-1.5">
                    <span className="text-xs text-muted-foreground">COD: </span>
                    <span className="text-sm font-semibold">{formatPKRFull(selected.codAmount)}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 px-3 py-1.5">
                    <span className="text-xs text-muted-foreground">Shipping: </span>
                    <span className="text-sm font-semibold">{formatPKRFull(selected.shippingFee)}</span>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                    <span className="text-xs text-red-600">Total loss: </span>
                    <span className="text-sm font-bold text-red-700">{formatPKRFull(selected.codAmount + selected.shippingFee)}</span>
                  </div>
                </div>
              </SectionCard>

              {/* Evidence timeline */}
              {selected.evidence && selected.evidence.length > 0 && (
                <SectionCard
                  title="Evidence Timeline"
                  description="Collected automatically for dispute & recovery"
                  action={
                    <button
                      onClick={() => toast({ title: "Evidence bundle downloaded", description: "PDF generated with full timeline" })}
                      className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export PDF
                    </button>
                  }
                >
                  <div className="relative">
                    <div className="absolute bottom-4 left-[15px] top-4 w-0.5 bg-border" />
                    <div className="space-y-4">
                      {selected.evidence.map((ev) => {
                        const Icon = evidenceIcons[ev.type];
                        const colors = evidenceColors[ev.type];
                        return (
                          <div key={ev.id} className="relative flex gap-4">
                            <div className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background", colors.bg)}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 rounded-lg border border-border bg-muted/20 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold">{ev.title}</p>
                                  <p className="text-sm text-muted-foreground">{ev.detail}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-xs font-medium">{formatTimeAgo(ev.timestamp)}</p>
                                  <p className="text-[10px] text-muted-foreground">{formatDateTime(ev.timestamp)}</p>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", colors.chip)}>
                                  {ev.type.replace(/_/g, " ")}
                                </span>
                                <span className="text-[11px] text-muted-foreground">Source: {ev.source}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* Dispute actions */}
              {selected.status === "RETURNING" && (
                <SectionCard title="Recovery & Dispute" description="Actions to recover this order or dispute courier report">
                  <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-violet-900">
                      <Bot className="h-4 w-4" />
                      AI Dispute Analysis
                    </p>
                    <p className="mt-1 text-sm text-violet-800">
                      Customer WhatsApp reply ("Rider aaya hi nahi") directly contradicts courier&apos;s "Refused to accept" report.
                      Recommend opening courier dispute with evidence bundle. Hold stock return until dispute resolution.
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      onClick={() => toast({ title: "Dispute opened with courier", description: `${selected.courier} will receive the evidence bundle` })}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-orange-300 bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Open Courier Dispute
                    </button>
                    <button
                      onClick={() => toast({ title: "Recovery message sent", description: "WhatsApp sent with re-delivery offer" })}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Offer Re-delivery
                    </button>
                    <button
                      onClick={() => toast({ title: "RTO finalized", description: "Stock return initiated" })}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/40 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <Undo2 className="h-4 w-4" />
                      Accept RTO
                    </button>
                  </div>
                </SectionCard>
              )}
            </div>
          ) : (
            <EmptyState icon={Undo2} title="No RTO selected" description="Select a return case from the left to view evidence and recovery options." />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
