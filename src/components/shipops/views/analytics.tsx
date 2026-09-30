"use client";

import { TrendingUp, TrendingDown, Download, Calendar, Filter, Truck, Banknote, Target, Zap } from "lucide-react";
import { deliveryTrend, courierPerformance, cityDistribution, dashboardMetrics } from "@/lib/mock-data";
import { formatPKR, formatPKRFull } from "@/lib/format";
import { PageContainer, SectionCard, CourierTag } from "../shared";
import { cn } from "@/lib/utils";

export function AnalyticsView() {
  const maxDispatched = Math.max(...deliveryTrend.map((d) => d.dispatched));
  const totalRevenue = 8475000;
  const totalShipping = 412500;
  const netRevenue = totalRevenue - totalShipping - 128000;

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
        <button className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
          <Download className="h-3.5 w-3.5" />
          Export Report
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Net Revenue", value: formatPKRFull(netRevenue), trend: "+15.2%", up: true, color: "text-emerald-600", icon: Banknote },
          { label: "Delivery Rate", value: "91.2%", trend: "+2.4%", up: true, color: "text-sky-600", icon: Target },
          { label: "Avg Delivery Time", value: "2.4 days", trend: "-0.3d", up: true, color: "text-violet-600", icon: Truck },
          { label: "RTO Rate", value: "6.8%", trend: "-1.2%", up: true, color: "text-rose-600", icon: TrendingDown },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <Icon className={cn("h-4 w-4", k.color)} />
                <span className={cn("text-[10px] font-semibold", k.up ? "text-emerald-600" : "text-red-600")}>{k.trend}</span>
              </div>
              <p className="text-xl font-bold">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Delivery trend chart */}
      <SectionCard title="Delivery Performance" description="Daily dispatched vs delivered vs returned (14 days)">
        <div className="h-72">
          <div className="flex h-full items-end justify-between gap-1.5">
            {deliveryTrend.map((d) => (
              <div key={d.day} className="group flex flex-1 flex-col items-center gap-1">
                <div className="relative flex h-full w-full flex-col-reverse items-center justify-start gap-0.5">
                  <div className="w-full rounded-t bg-rose-400 transition-all group-hover:bg-rose-500" style={{ height: `${(d.returned / maxDispatched) * 100}%`, minHeight: d.returned > 0 ? "4px" : "0" }} />
                  <div className="w-full rounded-t bg-emerald-500 transition-all group-hover:bg-emerald-600" style={{ height: `${(d.delivered / maxDispatched) * 100}%` }} />
                  <div className="absolute -top-1 w-full rounded-t bg-indigo-200/40" style={{ height: `${(d.dispatched / maxDispatched) * 100}%` }} />
                </div>
                <span className="text-[9px] text-muted-foreground">{d.day.split(" ")[1]}</span>
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
            {courierPerformance.map((c) => (
              <div key={c.courier} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <CourierTag courier={c.courier} />
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">{c.delivered} delivered</span>
                    <span className={cn("font-semibold", c.deliveryRate >= 90 ? "text-emerald-600" : c.deliveryRate >= 87 ? "text-amber-600" : "text-red-600")}>
                      {c.deliveryRate}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", c.deliveryRate >= 90 ? "bg-emerald-500" : c.deliveryRate >= 87 ? "bg-amber-500" : "bg-red-500")}
                    style={{ width: `${c.deliveryRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* City performance */}
        <SectionCard title="City Performance" description="Delivery rate by city (30d)">
          <div className="space-y-3">
            {[
              { city: "Karachi", rate: 93.2, orders: 842 },
              { city: "Lahore", rate: 91.4, orders: 614 },
              { city: "Islamabad", rate: 94.1, orders: 286 },
              { city: "Rawalpindi", rate: 88.7, orders: 168 },
              { city: "Faisalabad", rate: 90.2, orders: 142 },
              { city: "Multan", rate: 82.6, orders: 98 },
              { city: "Peshawar", rate: 85.3, orders: 76 },
            ].map((c) => (
              <div key={c.city} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.city}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">{c.orders} orders</span>
                    <span className={cn("font-semibold", c.rate >= 90 ? "text-emerald-600" : c.rate >= 85 ? "text-amber-600" : "text-red-600")}>
                      {c.rate}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", c.rate >= 90 ? "bg-emerald-500" : c.rate >= 85 ? "bg-amber-500" : "bg-red-500")}
                    style={{ width: `${c.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Financial breakdown */}
      <SectionCard title="Financial Breakdown" description="Revenue, costs & margins (30 days)">
        <div className="space-y-3">
          {[
            { label: "Gross COD Collected", value: formatPKRFull(totalRevenue), positive: true },
            { label: "Less: Shipping Cost", value: `- ${formatPKRFull(totalShipping)}`, negative: true },
            { label: "Less: Tax Withheld (CNIC)", value: `- ${formatPKRFull(128000)}`, negative: true },
            { label: "Less: RTO Losses", value: `- ${formatPKRFull(284000)}`, negative: true },
            { label: "Less: Platform Fee", value: `- ${formatPKRFull(45000)}`, negative: true },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between border-b border-border/60 pb-2 text-sm last:border-0">
              <span className="text-muted-foreground">{row.label}</span>
              <span className={cn("font-semibold tabular-nums", row.positive ? "text-emerald-600" : row.negative ? "text-red-600" : "")}>{row.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
            <span className="text-sm font-semibold text-emerald-900">Net Profit</span>
            <span className="text-lg font-bold text-emerald-700">{formatPKRFull(netRevenue - 284000 - 45000)}</span>
          </div>
        </div>
      </SectionCard>

      {/* Automation impact */}
      <SectionCard title="Automation Impact" description="Time & cost savings from automated workflows">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Hours Saved", value: "184h", icon: Zap, color: "text-violet-600 bg-violet-50" },
            { label: "Manual Tasks Avoided", value: "2,847", icon: TrendingDown, color: "text-orange-600 bg-orange-50" },
            { label: "Avg Response Time", value: "2 min", icon: Target, color: "text-emerald-600 bg-emerald-50" },
            { label: "Cost per Order", value: "Rs 12", icon: Banknote, color: "text-sky-600 bg-sky-50" },
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
