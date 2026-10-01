"use client";

import { useState, useMemo } from "react";
import { Zap, Plus, Play, Pause, CheckCircle2, Clock, TrendingUp, MoreHorizontal, Sparkles, Pencil, Trash2 } from "lucide-react";
import { formatTimeAgo } from "@/lib/format";
import { PageContainer, SectionCard, EmptyState } from "../shared";
import { LoadingScreen } from "../loading";
import { useApi, apiPatch } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { AutomationRule } from "@/lib/types";

const triggerColors: Record<string, string> = {
  ORDER_CREATED: "bg-amber-100 text-amber-700",
  ORDER_PENDING_30MIN: "bg-orange-100 text-orange-700",
  ORDER_PENDING_4H: "bg-red-100 text-red-700",
  ORDER_CONFIRMED: "bg-sky-100 text-sky-700",
  CUSTOMER_MESSAGE_RECEIVED: "bg-emerald-100 text-emerald-700",
  DELIVERY_FAILED: "bg-rose-100 text-rose-700",
  SHIPMENT_OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-700",
  ORDER_DELIVERED_24H: "bg-violet-100 text-violet-700",
  RETURN_CREATED: "bg-zinc-100 text-zinc-700",
};

export function AutomationView() {
  const { toast } = useToast();
  const { data, loading } = useApi<{ rules: AutomationRule[] }>("/api/v1/automation");
  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean>>({});

  const rules = useMemo(() => {
    const base = data?.rules || [];
    return base.map((r) => localOverrides[r.id] !== undefined ? { ...r, enabled: localOverrides[r.id] } : r);
  }, [data, localOverrides]);

  const toggleRule = async (id: string) => {
    const rule = rules.find((r) => r.id === id);
    const newEnabled = !rule?.enabled;
    setLocalOverrides((prev) => ({ ...prev, [id]: newEnabled }));
    toast({
      title: newEnabled ? "Rule activated" : "Rule paused",
      description: rule?.name,
    });
    // Persist to API
    const res = await apiPatch(`/api/v1/automation/${id}`, { enabled: newEnabled });
    if (!res.success) {
      // Revert on failure
      setLocalOverrides((prev) => ({ ...prev, [id]: !newEnabled }));
      toast({ title: "Failed to update rule", description: res.error, variant: "destructive" });
    }
  };

  const totalRuns = rules.reduce((s, r) => s + r.runsLast30Days, 0);
  const enabledCount = rules.filter((r) => r.enabled).length;

  if (loading) return <PageContainer><LoadingScreen message="Loading automation rules..." /></PageContainer>;

  return (
    <PageContainer className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active Rules", value: enabledCount, color: "text-emerald-600", icon: Zap },
          { label: "Runs (30 days)", value: totalRuns.toLocaleString(), color: "text-sky-600", icon: Play },
          { label: "Avg Success Rate", value: "82.4%", color: "text-violet-600", icon: TrendingUp },
          { label: "Hours Saved", value: "184h", color: "text-orange-600", icon: Clock },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <Icon className={cn("mb-1 h-4 w-4", s.color)} />
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Workflow visualization */}
      <SectionCard title="COD Confirmation Workflow" description="The primary automation pipeline for every new COD order">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { label: "Order Created", color: "bg-amber-500" },
            { label: "Send WhatsApp", color: "bg-emerald-500" },
            { label: "Wait 30 min", color: "bg-zinc-400" },
            { label: "Reminder #1", color: "bg-orange-500" },
            { label: "Wait 4 hours", color: "bg-zinc-400" },
            { label: "Reminder #2", color: "bg-orange-500" },
            { label: "Manual Review", color: "bg-red-500" },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5">
                <span className={cn("h-2 w-2 rounded-full", step.color)} />
                <span className="font-medium">{step.label}</span>
              </div>
              {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Rules list */}
      <SectionCard
        title="Automation Rules"
        description={`${rules.length} rules configured`}
        action={
          <button
            onClick={() => toast({ title: "Rule builder", description: "Visual workflow editor will open" })}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            New Rule
          </button>
        }
        bodyClassName="p-0"
      >
        <div className="divide-y divide-border">
          {rules.map((rule) => (
            <div key={rule.id} className="p-4 lg:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{rule.name}</p>
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", triggerColors[rule.trigger] || "bg-zinc-100 text-zinc-700")}>
                      {rule.triggerLabel}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{rule.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toast({ title: "Test run started", description: rule.name })}
                    className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium hover:bg-muted"
                  >
                    <Play className="h-3 w-3" />
                    Test
                  </button>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      rule.enabled ? "bg-emerald-500" : "bg-muted"
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                      rule.enabled ? "left-[18px]" : "left-0.5"
                    )} />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">When</p>
                  <ul className="space-y-0.5">
                    {rule.conditions.map((c, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Then</p>
                  <ul className="space-y-0.5">
                    {rule.actions.map((a, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>{rule.runsLast30Days.toLocaleString()} runs (30d)</span>
                  <span>·</span>
                  <span className={rule.successRate >= 90 ? "text-emerald-600 font-medium" : rule.successRate >= 50 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                    {rule.successRate}% success
                  </span>
                  {rule.lastRunAt && (
                    <>
                      <span>·</span>
                      <span>Last: {formatTimeAgo(rule.lastRunAt)}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toast({ title: "Edit rule", description: rule.name })} className="rounded p-1 hover:bg-muted">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => toast({ title: "View run history", description: rule.name })} className="rounded p-1 hover:bg-muted">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* AI suggestions */}
      <SectionCard title="AI-Suggested Automations" description="Patterns detected by ShipOps AI that could be automated" action={<Sparkles className="h-4 w-4 text-violet-500" />}>
        <div className="space-y-3">
          {[
            { title: "Auto-block repeat RTO customers", desc: "3 customers have >50% RTO rate. Auto-flagging could save Rs 18,000/month.", impact: "Rs 18,000/month" },
            { title: "Add SMS fallback for unresponsive WhatsApp", desc: "12% of unconfirmed orders respond to SMS within 1 hour after WhatsApp fails.", impact: "~18 more confirmations/month" },
            { title: "Switch Faisalabad orders from TCS to Trax", desc: "Trax shows 94% delivery rate in Faisalabad vs TCS 88%. Same cost.", impact: "~6 fewer RTOs/month" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-violet-900">{s.title}</p>
                <p className="text-xs text-violet-700">{s.desc}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Impact</p>
                <p className="text-xs font-semibold text-violet-800">{s.impact}</p>
              </div>
              <button
                onClick={() => toast({ title: "Creating rule from suggestion", description: s.title })}
                className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
              >
                Create
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
