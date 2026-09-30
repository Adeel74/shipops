"use client";

import { TrendingUp, TrendingDown, Download, Calendar, Filter, Truck, Banknote, Target, Zap } from "lucide-react";
import { formatPKR, formatPKRFull } from "@/lib/format";
import { PageContainer, SectionCard, CourierTag } from "../shared";
import { LoadingScreen } from "../loading";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  kpis: {
    netRevenue: number;
    deliveryRate: number;
    avgDeliveryTime: number;
    rtoRate: number;
    grossRevenue: number;
    totalShippingCost: number;
    taxWithheld: number;
    rtoLosses: number;
    platformFee: number;
  };
  trend: { day: string; delivered: number; returned: number; dispatched: number }[];
  courierPerformance: { courier: string; delivered: number; returned: number; deliveryRate: number; cost: number }[];
  cityDistribution: { city: string; orders: number; percentage: number }[];
  cityDeliveryRates: { city: string; orders: number; rate: number }[];
  financial: {
    grossCODCollected: number;
    shippingCost: number;
    taxWithheld: number;
    rtoLosses: number;
    platformFee: number;
    netProfit: number;
  };
  automationImpact: {
    hoursSaved: number;
    manualTasksAvoided: number;
    avgResponseTime: string;
    costPerOrder: number;
  };
}

export function AnalyticsView() {
  const { toast } = useToast();
  const { data, loading } = useApi<AnalyticsData>("/api/v1/analytics");

  if (loading || !data) return <PageContainer><LoadingScreen message="Computing analytics..." /></PageContainer>;

  const maxDispatched = Math.max(...data.trend.map((d) => d.dispatched), 1);
  const k = data.kpis;
  const f = data.financial;

  const kpiCards = [
    { label: "Net Revenue", value: formatPKRFull(k.netRevenue), trend: "+15.2%", up: true, color: "text-emerald-600", icon: Banknote },
    { label: "Delivery Rate", value: `${k.deliveryRate}%`, trend: k.deliveryRate >= 85 ? "Good" : "Needs attention", up: k.deliveryRate >= 85, color: "text-sky-600", icon: Target },
    { label: "Avg Delivery Time", value: `${k.avgDeliveryTime} days`, trend: "-0.3d", up: true, color: "text-violet-600", icon: Truck },
    { label: "RTO Rate", value: `${k.rtoRate}%`, trend: k.rtoRate <= 10 ? "Low" : "High", up: k.rtoRate <= 10, color: "text-rose-600", icon: TrendingDown },
  ];

  return (
    <PageContainer className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted">
            <Calendar className="h-3.5 w-3.5" />
            Last 30 days
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted">
            <Filter className="h-3.5 w-3.5" />
            All Couriers
          </button>
        </div>
        <button
          onClick={() => toast({ title: "Exporting report...", description: "CSV will download shortly" })}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Download className="h-3.5 w-3.5" />
          Export Report
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map((kp) => {
          const Icon = kp.icon;
          return (
            <div key={kp.label} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <Icon className={cn("h-4 w-4", kp.color)} />
                <span className={cn("text-[10px] font-semibold", kp.up ? "text-emerald-600" : "text-red-600")}>{kp.trend}</span>
              </div>
              <p className="text-xl font-bold">{kp.value}</p>
              <p className="text-xs text-muted-foreground">{kp.label}</p>
            </div>
          );
        })}
      </div>

      {/* Delivery trend chart */}
      <SectionCard title="Delivery Performance" description="Daily dispatched vs delivered vs returned (14 days)">
        <div className="h-72">
          <div className="flex h-full items-end justify-between gap-1.5">
            {data.trend.map((d) => (
              <div key={d.day} className="group flex flex-1 flex-col items-center gap-1">
                <div className="relative flex h-full w-full flex-col-reverse items-center justify-start gap-0.5">
                  <div className="w-full rounded-t bg-rose-400 transition-all group-hover:bg-rose-500" style={{ height: `${(d.returned / maxDispatched) * 100}%`, minHeight: d.returned > 0 ? "4px" : "0" }} />
                  <div className="w-full rounded-t bg-emerald-500 transition-all group-hover:bg-emerald-600" style={{ height: `${(d.delivered / maxDispatched) * 100}%` }} />
                  <div className="absolute -top-1 w-full rounded-t bg-indigo-200/40" style={{ height: `${(d.dispatched / maxDispatched) * 100}%` }} />
                </div>
                <span className="text-[9px] text-muted-foreground">{d.day.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2 text-xs">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-300" />Dispatched</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Delivered</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" />Returned</span>
        </div>
      </SectionCard>

      {/* Two column */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Courier comparison */}
        <SectionCard title="Courier Comparison" description="Performance by courier (30d)">
          <div className="space-y-3">
            {data.courierPerformance.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No courier data yet</p>
            ) : (
              data.courierPerformance.map((c) => (
                <div key={c.courier} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <CourierTag courier={c.courier} />
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">{c.delivered} delivered</span>
                      <span className={cn("font-semibold", c.deliveryRate >= 90 ? "text-emerald-600" : c.deliveryRate >= 80 ? "text-amber-600" : "text-red-600")}>
                        {c.deliveryRate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", c.deliveryRate >= 90 ? "bg-emerald-500" : c.deliveryRate >= 80 ? "bg-amber-500" : "bg-red-500")}
                      style={{ width: `${c.deliveryRate}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* City performance */}
        <SectionCard title="City Performance" description="Delivery rate by city (30d)">
          <div className="space-y-3">
            {data.cityDeliveryRates.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No city data yet</p>
            ) : (
              data.cityDeliveryRates.map((c) => (
                <div key={c.city} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.city}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">{c.orders} orders</span>
                      <span className={cn("font-semibold", c.rate >= 90 ? "text-emerald-600" : c.rate >= 80 ? "text-amber-600" : "text-red-600")}>
                        {c.rate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", c.rate >= 90 ? "bg-emerald-500" : c.rate >= 80 ? "bg-amber-500" : "bg-red-500")}
                      style={{ width: `${c.rate}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {/* Financial breakdown */}
      <SectionCard title="Financial Breakdown" description="Revenue, costs & margins (30 days)">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2 text-sm">
            <span className="text-muted-foreground">Gross COD Collected</span>
            <span className="font-semibold tabular-nums text-emerald-600">{formatPKRFull(f.grossCODCollected)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-border/60 pb-2 text-sm">
            <span className="text-muted-foreground">Less: Shipping Cost</span>
            <span className="font-semibold tabular-nums text-red-600">- {formatPKRFull(f.shippingCost)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-border/60 pb-2 text-sm">
            <span className="text-muted-foreground">Less: Tax Withheld (CNIC)</span>
            <span className="font-semibold tabular-nums text-red-600">- {formatPKRFull(f.taxWithheld)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-border/60 pb-2 text-sm">
            <span className="text-muted-foreground">Less: RTO Losses</span>
            <span className="font-semibold tabular-nums text-red-600">- {formatPKRFull(f.rtoLosses)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-border/60 pb-2 text-sm">
            <span className="text-muted-foreground">Less: Platform Fee</span>
            <span className="font-semibold tabular-nums text-red-600">- {formatPKRFull(f.platformFee)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
            <span className="text-sm font-semibold text-emerald-900">Net Profit</span>
            <span className="text-lg font-bold text-emerald-700">{formatPKRFull(f.netProfit)}</span>
          </div>
        </div>
      </SectionCard>

      {/* Automation impact */}
      <SectionCard title="Automation Impact" description="Time & cost savings from automated workflows">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Hours Saved", value: `${data.automationImpact.hoursSaved}h`, icon: Zap, color: "text-violet-600 bg-violet-50" },
            { label: "Manual Tasks Avoided", value: data.automationImpact.manualTasksAvoided.toLocaleString(), icon: TrendingDown, color: "text-orange-600 bg-orange-50" },
            { label: "Avg Response Time", value: data.automationImpact.avgResponseTime, icon: Target, color: "text-emerald-600 bg-emerald-50" },
            { label: "Cost per Order", value: `Rs ${data.automationImpact.costPerOrder}`, icon: Banknote, color: "text-sky-600 bg-sky-50" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-lg", s.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
