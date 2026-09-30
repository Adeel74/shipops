"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, Sparkles, MapPinOff, PhoneOff, UserX, PackageX, Clock, Copy, Send, Check, ArrowUpRight, MessageCircle, Phone } from "lucide-react";
import { formatTimeAgo, formatDateTime } from "@/lib/format";
import { PageContainer, SectionCard, EmptyState } from "../shared";
import { LoadingScreen } from "../loading";
import { useApi, apiPost } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { AttentionType, AttentionCase } from "@/lib/types";

const typeIcons: Record<AttentionType, typeof AlertTriangle> = {
  BAD_ADDRESS: MapPinOff,
  CUSTOMER_UNREACHABLE: PhoneOff,
  CUSTOMER_REFUSED: UserX,
  FAILED_DELIVERY: PackageX,
  COURIER_DELAY: Clock,
  HIGH_RTO_RISK: AlertTriangle,
  PAYMENT_ISSUE: AlertTriangle,
  DUPLICATE_ORDER: Copy,
};

const typeColors: Record<AttentionType, { bg: string; text: string; border: string; icon: string }> = {
  BAD_ADDRESS: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "bg-amber-500" },
  CUSTOMER_UNREACHABLE: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", icon: "bg-sky-500" },
  CUSTOMER_REFUSED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "bg-red-500" },
  FAILED_DELIVERY: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: "bg-orange-500" },
  COURIER_DELAY: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: "bg-violet-500" },
  HIGH_RTO_RISK: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: "bg-rose-500" },
  PAYMENT_ISSUE: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", icon: "bg-yellow-500" },
  DUPLICATE_ORDER: { bg: "bg-zinc-50", text: "text-zinc-700", border: "border-zinc-200", icon: "bg-zinc-500" },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  URGENT: { color: "text-red-700", bg: "bg-red-100 border-red-200" },
  HIGH: { color: "text-amber-700", bg: "bg-amber-100 border-amber-200" },
  MEDIUM: { color: "text-sky-700", bg: "bg-sky-100 border-sky-200" },
  LOW: { color: "text-zinc-600", bg: "bg-zinc-100 border-zinc-200" },
};

export function AttentionView() {
  const { toast } = useToast();
  const { data, loading, refetch } = useApi<{ cases: AttentionCase[] }>("/api/v1/attention");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const allCases = data?.cases || [];
  const openCases = allCases.filter((c) => !resolved.has(c.id));

  const selected = useMemo(() => {
    if (openCases.length === 0) return null;
    return openCases.find((c) => c.id === selectedId) || openCases[0];
  }, [openCases, selectedId]);

  const handleResolve = async (c: AttentionCase) => {
    const res = await apiPost(`/api/v1/attention/${c.id}/resolve`, { resolution: "Resolved by operator" });
    if (res.success) {
      setResolved((prev) => new Set(prev).add(c.id));
      setSelectedId(null);
      toast({ title: "Case resolved", description: `${c.title} for ${c.customerName} has been marked resolved.` });
      refetch();
    }
  };

  const handleContact = (method: "whatsapp" | "call") => {
    toast({
      title: method === "whatsapp" ? "WhatsApp sent" : "Call initiated",
      description: method === "whatsapp" ? "Recovery message sent to customer" : "Connecting to customer phone...",
    });
  };

  if (loading) return <PageContainer><LoadingScreen message="Loading attention cases..." /></PageContainer>;

  return (
    <PageContainer>
      {/* Summary strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Open Cases", value: openCases.length, color: "text-red-600" },
          { label: "Urgent", value: openCases.filter((c) => c.priority === "URGENT").length, color: "text-red-700" },
          { label: "High Priority", value: openCases.filter((c) => c.priority === "HIGH").length, color: "text-amber-600" },
          { label: "AI Auto-Triaged", value: openCases.length, color: "text-violet-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Cases list */}
        <div className="lg:col-span-2">
          <p className="mb-3 text-sm font-semibold">{openCases.length} open cases</p>
          <div className="space-y-2 lg:max-h-[calc(100vh-18rem)] lg:overflow-y-auto lg:pr-1">
            {openCases.length === 0 ? (
              <EmptyState icon={Check} title="All resolved!" description="No open attention cases. You're all caught up." />
            ) : (
              openCases.map((c) => {
                const Icon = typeIcons[c.type];
                const colors = typeColors[c.type];
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "w-full rounded-xl border bg-card p-3.5 text-left transition-all hover:shadow-sm",
                      selected?.id === c.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white", colors.icon)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{c.customerName}</p>
                          <span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold", priorityConfig[c.priority].bg, priorityConfig[c.priority].color)}>
                            {c.priority}
                          </span>
                        </div>
                        <p className="truncate text-xs font-medium text-muted-foreground">{c.title}</p>
                        <p className="text-[11px] text-muted-foreground">{c.orderNumber} · {c.city}</p>
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{c.overdueHours}h overdue</span>
                          {c.attemptsLeft !== undefined && <span>· {c.attemptsLeft} attempts left</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="space-y-4">
              {/* Case header */}
              <SectionCard>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {(() => {
                      const Icon = typeIcons[selected.type];
                      const colors = typeColors[selected.type];
                      return (
                        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl text-white", colors.icon)}>
                          <Icon className="h-5 w-5" />
                        </div>
                      );
                    })()}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold">{selected.customerName}</h2>
                        <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold", priorityConfig[selected.priority].bg, priorityConfig[selected.priority].color)}>
                          {selected.priority}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{selected.title} · {selected.orderNumber} · {selected.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Overdue</p>
                    <p className="text-xl font-bold text-red-600">{selected.overdueHours}h</p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-sm">{selected.description}</p>
                </div>
              </SectionCard>

              {/* AI recommendation */}
              <SectionCard
                title="AI Analysis & Recommendation"
                description="Auto-classified by ShipOps AI engine"
                action={
                  <div className="flex items-center gap-1.5 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                    <Sparkles className="h-3 w-3" />
                    {selected.aiConfidence}% confidence
                  </div>
                }
              >
                <div className="rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Recommended Action
                  </p>
                  <p className="text-sm text-violet-900">{selected.recommendedAction}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">AI Confidence</p>
                    <p className="text-sm font-bold text-violet-600">{selected.aiConfidence}%</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Priority</p>
                    <p className={cn("text-sm font-bold", priorityConfig[selected.priority].color)}>{selected.priority}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-bold">{formatTimeAgo(selected.createdAt)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Attempts</p>
                    <p className="text-sm font-bold">{selected.attemptsLeft ?? "—"}</p>
                  </div>
                </div>
              </SectionCard>

              {/* Order context */}
              {selected && (
                <SectionCard title="Order Context" description={`${selected.orderNumber} · ${selected.city}`}>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Order Number</p>
                      <p className="text-sm font-bold">{selected.orderNumber}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="text-sm font-semibold">{selected.customerName}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">City</p>
                      <p className="text-sm font-semibold">{selected.city}</p>
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* Actions */}
              <SectionCard title="Resolve This Case" description="Take action or contact customer">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button
                    onClick={() => handleContact("whatsapp")}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">Send WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleContact("call")}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 p-3 hover:bg-sky-100 transition-colors"
                  >
                    <Phone className="h-5 w-5 text-sky-600" />
                    <span className="text-xs font-semibold text-sky-700">Call Customer</span>
                  </button>
                  <button
                    onClick={() => toast({ title: "Courier notified", description: "Support ticket created with courier" })}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 p-3 hover:bg-orange-100 transition-colors"
                  >
                    <Send className="h-5 w-5 text-orange-600" />
                    <span className="text-xs font-semibold text-orange-700">Notify Courier</span>
                  </button>
                  <button
                    onClick={() => handleResolve(selected)}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-500 p-3 text-white hover:bg-emerald-600 transition-colors"
                  >
                    <Check className="h-5 w-5" />
                    <span className="text-xs font-semibold">Resolve</span>
                  </button>
                </div>
              </SectionCard>
            </div>
          ) : (
            <EmptyState icon={Check} title="No cases selected" description="Select a case from the left to see AI recommendations and actions." />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
