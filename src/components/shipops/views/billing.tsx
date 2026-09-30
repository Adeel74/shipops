"use client";

import { Check, CreditCard, Download, Zap, TrendingUp, Sparkles } from "lucide-react";
import { PageContainer, SectionCard } from "../shared";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Starter",
    price: "Rs 2,500",
    period: "/month",
    target: "Small stores (up to 500 orders/mo)",
    features: ["Shopify sync", "WhatsApp confirmations", "1 courier integration", "Basic dashboard", "Email support"],
    current: false,
    color: "border-border",
  },
  {
    name: "Growth",
    price: "Rs 6,500",
    period: "/month",
    target: "Growing stores (up to 3,000 orders/mo)",
    features: ["Everything in Starter", "All courier integrations", "Needs Attention + AI triage", "Automation rules (10)", "RTO evidence bundle", "Priority support"],
    current: true,
    color: "border-primary ring-2 ring-primary/20",
  },
  {
    name: "Business",
    price: "Rs 15,000",
    period: "/month",
    target: "High-volume stores (up to 10K orders/mo)",
    features: ["Everything in Growth", "AI risk engine", "Unlimited automations", "Team members (10)", "API access", "Dedicated account manager"],
    current: false,
    color: "border-border",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    target: "Large operations (10K+ orders/mo)",
    features: ["Everything in Business", "Custom courier integrations", "White-label option", "SLA guarantee", "Onboarding & training", "24/7 phone support"],
    current: false,
    color: "border-border",
  },
];

export function BillingView() {
  const { toast } = useToast();

  return (
    <PageContainer className="space-y-5">
      {/* Current plan */}
      <SectionCard title="Current Subscription">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">Growth Plan</p>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">ACTIVE</span>
              </div>
              <p className="text-sm text-muted-foreground">Rs 6,500/month · Renews on Oct 15, 2026</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">This month&apos;s usage</p>
            <p className="text-2xl font-bold">1,842 <span className="text-sm font-normal text-muted-foreground">/ 3,000 orders</span></p>
            <div className="mt-1 h-2 w-40 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: "61%" }} />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Usage breakdown */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Orders Synced", value: "1,842", limit: "3,000", color: "text-emerald-600" },
          { label: "WhatsApp Sent", value: "1,648", limit: "3,000", color: "text-emerald-600" },
          { label: "AI Analyses", value: "412", limit: "500", color: "text-amber-600" },
          { label: "Team Members", value: "5", limit: "5", color: "text-zinc-600" },
        ].map((u) => (
          <div key={u.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{u.label}</p>
            <p className={cn("text-xl font-bold", u.color)}>{u.value} <span className="text-xs font-normal text-muted-foreground">/ {u.limit}</span></p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", u.color === "text-emerald-600" ? "bg-emerald-500" : u.color === "text-amber-600" ? "bg-amber-500" : "bg-zinc-400")} style={{ width: `${(parseInt(u.value.replace(",", "")) / parseInt(u.limit.replace(",", ""))) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Plans */}
      <SectionCard title="Available Plans" description="Upgrade or downgrade anytime">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div key={plan.name} className={cn("rounded-xl border bg-card p-4", plan.color)}>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-bold">{plan.name}</p>
                {plan.current && <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">CURRENT</span>}
              </div>
              <p className="mb-3 text-xs text-muted-foreground">{plan.target}</p>
              <div className="mb-3 flex items-baseline gap-0.5">
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-xs text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mb-4 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => toast({ title: plan.current ? "You're on this plan" : `Switching to ${plan.name}...`, description: plan.current ? undefined : "Changes apply on next billing cycle" })}
                disabled={plan.current}
                className={cn(
                  "w-full rounded-md py-2 text-xs font-medium",
                  plan.current ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {plan.current ? "Current Plan" : `Switch to ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Payment method */}
      <SectionCard title="Payment Method">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-14 items-center justify-center rounded-md bg-gradient-to-br from-zinc-700 to-zinc-900 text-white">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">•••• •••• •••• 4242</p>
              <p className="text-xs text-muted-foreground">Visa · Expires 08/28</p>
            </div>
          </div>
          <button onClick={() => toast({ title: "Update payment method" })} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
            Update
          </button>
        </div>
      </SectionCard>

      {/* Invoices */}
      <SectionCard title="Invoice History" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Invoice</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Download</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: "INV-2026-09", date: "Sep 15, 2026", amount: "Rs 6,500", status: "Paid" },
                { id: "INV-2026-08", date: "Aug 15, 2026", amount: "Rs 6,500", status: "Paid" },
                { id: "INV-2026-07", date: "Jul 15, 2026", amount: "Rs 6,500", status: "Paid" },
                { id: "INV-2026-06", date: "Jun 15, 2026", amount: "Rs 2,500", status: "Paid" },
                { id: "INV-2026-05", date: "May 15, 2026", amount: "Rs 2,500", status: "Paid" },
              ].map((inv) => (
                <tr key={inv.id} className="border-t border-border/60 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-mono text-xs font-medium">{inv.id}</td>
                  <td className="px-4 py-2.5">{inv.date}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{inv.amount}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <Check className="h-2.5 w-2.5" />
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => toast({ title: "Downloading invoice", description: inv.id })} className="rounded p-1 hover:bg-muted">
                      <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
