"use client";

import { Sparkles, AlertTriangle, TrendingUp, TrendingDown, Bot, Check, ArrowRight, Zap, Brain, Target, Lightbulb } from "lucide-react";
import { formatPKRFull } from "@/lib/format";
import { PageContainer, SectionCard, RiskBadge } from "../shared";
import { LoadingScreen } from "../loading";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AiInsightsData {
  dailySummary: {
    date: string;
    totalOrders: number;
    confirmed: number;
    pendingConfirmation: number;
    attentionCases: number;
    rtoPredicted: number;
    revenueAtRisk: number;
  };
  predictions: {
    id: string;
    orderId: string;
    customerName: string;
    riskScore: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    prediction: string;
    recommendedAction: string;
    impact: string;
  }[];
  automationsSuggested: {
    id: string;
    title: string;
    reason: string;
    impact: string;
  }[];
}

export function AiView() {
  const { toast } = useToast();
  const { data, loading } = useApi<AiInsightsData>("/api/v1/ai/insights");

  if (loading || !data) return <PageContainer><LoadingScreen message="AI analyzing your operations..." /></PageContainer>;

  const s = data.dailySummary;

  return (
    <PageContainer className="space-y-5">
      {/* AI banner */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-5 text-white">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
              <Brain className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-wider opacity-90">ShipOps AI · Daily Operations Summary</span>
          </div>
          <h2 className="text-2xl font-bold lg:text-3xl">Today: {s.totalOrders} orders · {s.confirmed} confirmed · {s.attentionCases} need attention</h2>
          <p className="mt-1 max-w-2xl text-sm opacity-90">
            AI predicts <strong className="font-semibold">{s.rtoPredicted} orders will likely RTO</strong> ({formatPKRFull(s.revenueAtRisk)} revenue at risk).
            Top priority: recover Maham Ali&apos;s refused delivery and verify Sana Tariq before dispatch.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur">
              <span className="text-xs opacity-80">Pending Confirmation</span>
              <p className="text-lg font-bold">{s.pendingConfirmation}</p>
            </div>
            <div className="rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur">
              <span className="text-xs opacity-80">Attention Cases</span>
              <p className="text-lg font-bold">{s.attentionCases}</p>
            </div>
            <div className="rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur">
              <span className="text-xs opacity-80">Predicted RTOs</span>
              <p className="text-lg font-bold">{s.rtoPredicted}</p>
            </div>
            <div className="rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur">
              <span className="text-xs opacity-80">Revenue at Risk</span>
              <p className="text-lg font-bold">{formatPKRFull(s.revenueAtRisk)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk predictions */}
      <SectionCard
        title="RTO Risk Predictions"
        description="AI-analyzed orders with risk scores & recommended actions"
        action={<Sparkles className="h-4 w-4 text-violet-500" />}
      >
        <div className="space-y-3">
          {data.predictions.map((p) => (
            <div key={p.id} className={cn(
              "rounded-xl border p-4",
              p.riskLevel === "HIGH" ? "border-red-200 bg-red-50/40" : p.riskLevel === "MEDIUM" ? "border-amber-200 bg-amber-50/40" : "border-emerald-200 bg-emerald-50/40"
            )}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{p.orderId}</span>
                    <span className="text-sm text-muted-foreground">{p.customerName}</span>
                    <RiskBadge level={p.riskLevel} score={p.riskScore} />
                  </div>
                  <p className="mt-1.5 text-sm">{p.prediction}</p>
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-background p-2.5">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-700">Recommended Action</p>
                      <p className="text-sm text-foreground">{p.recommendedAction}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Impact: <span className="font-medium text-foreground">{p.impact}</span></p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="relative h-16 w-16">
                    <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray={`${(p.riskScore / 100) * 176} 176`}
                        strokeLinecap="round"
                        className={p.riskScore >= 60 ? "text-red-500" : p.riskScore >= 35 ? "text-amber-500" : "text-emerald-500"}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={cn("text-lg font-bold", p.riskScore >= 60 ? "text-red-600" : p.riskScore >= 35 ? "text-amber-600" : "text-emerald-600")}>{p.riskScore}</span>
                      <span className="text-[9px] text-muted-foreground">RTO risk</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toast({ title: "Action approved", description: `Applying recommendation for ${p.orderId}` })}
                    className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Check className="h-3 w-3" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* AI tool architecture */}
      <SectionCard title="AI Tool Architecture" description="ShipOps AI operates through controlled, auditable tools — no direct DB access">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { name: "getOrder", desc: "Fetch order details" },
            { name: "getCustomer", desc: "Fetch customer profile" },
            { name: "getCustomerHistory", desc: "Past orders & RTOs" },
            { name: "getTracking", desc: "Courier tracking events" },
            { name: "getConversation", desc: "WhatsApp messages" },
            { name: "calculateRisk", desc: "Compute RTO risk score" },
            { name: "createAttentionCase", desc: "Flag for human review" },
            { name: "prepareMessage", desc: "Draft WhatsApp reply" },
          ].map((tool) => (
            <div key={tool.name} className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-violet-600" />
                <code className="text-xs font-semibold text-violet-700">{tool.name}()</code>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{tool.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span><strong>Human-in-the-loop:</strong> AI never executes customer-facing actions automatically. All WhatsApp messages and shipment changes require operator approval before sending.</span>
          </p>
        </div>
      </SectionCard>

      {/* Suggested automations */}
      <SectionCard title="AI-Suggested Optimizations" description="Patterns detected that could improve your operations" action={<Target className="h-4 w-4 text-violet-500" />}>
        <div className="space-y-3">
          {data.automationsSuggested.map((sug) => (
            <div key={sug.id} className="flex flex-wrap items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500 text-white">
                <Zap className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-violet-900">{sug.title}</p>
                <p className="text-xs text-violet-700">{sug.reason}</p>
                <p className="mt-1 text-[11px] font-medium text-violet-800">Expected impact: {sug.impact}</p>
              </div>
              <button
                onClick={() => toast({ title: "Suggestion accepted", description: sug.title })}
                className="flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
              >
                Apply
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
