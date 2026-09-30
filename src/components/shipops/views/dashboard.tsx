"use client";

import { TrendingUp, TrendingDown, Truck, CheckCircle2, Wallet, Banknote, Receipt, Percent, Clock, ArrowUpRight, ArrowDownRight, Package, AlertTriangle, Undo2, Inbox } from "lucide-react";
import { dashboardMetrics, deliveryTrend, courierPerformance, cityDistribution, orders, attentionCases } from "@/lib/mock-data";
import { formatPKR, formatPKRFull } from "@/lib/format";
import { PageContainer, SectionCard, StatusBadge, CourierTag } from "../shared";
import { cn } from "@/lib/utils";
import type { ViewKey, Order } from "@/lib/types";

interface DashboardViewProps {
  onNavigate: (v: ViewKey) => void;
  onOpenOrder?: (order: Order) => void;
}

export function DashboardView({ onNavigate, onOpenOrder }: DashboardViewProps) {
  const m = dashboardMetrics;
  const maxDispatched = Math.max(...deliveryTrend.map((d) => d.dispatched));

  const kpis = [
    { label: "In Transit", value: m.inTransit.toString(), sub: "Active shipments", icon: Truck, color: "text-indigo-600", bg: "bg-indigo-50", trend: "+12", trendUp: true },
    { label: "Delivered", value: m.delivered.toLocaleString(), sub: `${m.deliveryRate}% delivery rate`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+8.4%", trendUp: true },
    { label: "In Your Bank", value: formatPKR(m.inYourBank), sub: "COD remitted to bank", icon: Wallet, color: "text-teal-600", bg: "bg-teal-50", trend: "+15.2%", trendUp: true },
    { label: "Courier Owes", value: formatPKR(m.courierOwes), sub: "Pending remittance", icon: Banknote, color: "text-zinc-600", bg: "bg-zinc-50", trend: "Rs 0", trendUp: true },
    { label: "Shipping Cost", value: formatPKR(m.shippingCost), sub: "This month", icon: Receipt, color: "text-orange-600", bg: "bg-orange-50", trend: "+4.1%", trendUp: false },
    { label: "Tax Withheld", value: formatPKR(m.taxWithheld), sub: "Sales tax (CNIC)", icon: Percent, color: "text-violet-600", bg: "bg-violet-50", trend: "+2.3%", trendUp: false },
  ];

  const todayStats = [
    { label: "Today's Orders", value: m.todaysOrders, icon: Package, color: "text-zinc-600" },
    { label: "Pending Confirmation", value: m.pendingConfirmation, icon: Inbox, color: "text-amber-600" },
    { label: "Confirmed", value: m.confirmed, icon: CheckCircle2, color: "text-sky-600" },
    { label: "In Transit", value: m.inTransit, icon: Truck, color: "text-indigo-600" },
    { label: "Delivered", value: 187, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "RTO", value: m.rto, icon: Undo2, color: "text-rose-600" },
  ];

  return (
    <PageContainer className="space-y-5">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4 xl:grid-cols-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", kpi.bg)}>
                  <Icon className={cn("h-4 w-4", kpi.color)} />
                </div>
                <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-semibold", kpi.trendUp ? "text-emerald-600" : "text-red-600")}>
                  {kpi.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {kpi.trend}
                </span>
              </div>
              <p className="text-xl font-bold tracking-tight lg:text-2xl">{kpi.value}</p>
              <p className="text-xs font-medium text-foreground/80">{kpi.label}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Today snapshot */}
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-gradient-to-br from-card to-muted/20 p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-6 lg:gap-4 lg:p-5">
        {todayStats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex flex-col gap-1">
              <Icon className={cn("h-4 w-4", s.color)} />
              <p className="text-lg font-bold tracking-tight lg:text-xl">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Delivery trend */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Delivery Performance — Last 14 Days"
            description="Daily dispatched, delivered & returned orders"
            action={
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" />Dispatched</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Delivered</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" />Returned</span>
              </div>
            }
          >
            <div className="h-64">
              <div className="flex h-full items-end justify-between gap-1.5">
                {deliveryTrend.map((d) => (
                  <div key={d.day} className="group flex flex-1 flex-col items-center gap-1">
                    <div className="relative flex h-full w-full flex-col-reverse items-center justify-start gap-0.5">
                      <div
                        className="w-full rounded-t bg-rose-300 transition-all group-hover:bg-rose-400"
                        style={{ height: `${(d.returned / maxDispatched) * 100}%`, minHeight: d.returned > 0 ? "4px" : "0" }}
                        title={`Returned: ${d.returned}`}
                      />
                      <div
                        className="w-full rounded-t bg-emerald-500 transition-all group-hover:bg-emerald-600"
                        style={{ height: `${(d.delivered / maxDispatched) * 100}%` }}
                        title={`Delivered: ${d.delivered}`}
                      />
                      <div
                        className="absolute -top-1 w-full rounded-t bg-indigo-200/40"
                        style={{ height: `${(d.dispatched / maxDispatched) * 100}%` }}
                        title={`Dispatched: ${d.dispatched}`}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{d.day.split(" ")[1]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Avg delivery rate (14d)</p>
                <p className="text-lg font-bold text-emerald-600">91.2%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg RTO rate (14d)</p>
                <p className="text-lg font-bold text-rose-600">6.8%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg delivery time</p>
                <p className="text-lg font-bold">{m.avgDeliveryTime} days</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-muted-foreground">Total dispatched</p>
                <p className="text-lg font-bold">2,695</p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* City distribution */}
        <SectionCard title="Orders by City" description="Geographic distribution (30d)">
          <div className="space-y-2.5">
            {cityDistribution.map((c) => (
              <div key={c.city}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{c.city}</span>
                  <span className="text-muted-foreground">{c.orders} ({c.percentage}%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" style={{ width: `${c.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Courier performance + Quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Courier Performance" description="Last 30 days delivery rate & cost" action={<button onClick={() => onNavigate("couriers")} className="text-xs font-medium text-primary hover:underline">Manage →</button>}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Courier</th>
                    <th className="pb-2 text-right font-medium">Delivered</th>
                    <th className="pb-2 text-right font-medium">Returned</th>
                    <th className="pb-2 text-right font-medium">Delivery %</th>
                    <th className="pb-2 text-right font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {courierPerformance.map((c) => (
                    <tr key={c.courier} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5"><CourierTag courier={c.courier} /></td>
                      <td className="py-2.5 text-right tabular-nums">{c.delivered}</td>
                      <td className="py-2.5 text-right tabular-nums text-rose-600">{c.returned}</td>
                      <td className="py-2.5 text-right">
                        <span className={cn("inline-flex items-center gap-1 font-semibold tabular-nums", c.deliveryRate >= 90 ? "text-emerald-600" : c.deliveryRate >= 87 ? "text-amber-600" : "text-red-600")}>
                          {c.deliveryRate >= 90 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {c.deliveryRate}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right tabular-nums">{formatPKR(c.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {/* Action queue */}
        <SectionCard title="Action Queue" description="Items that need your attention" action={<Clock className="h-4 w-4 text-muted-foreground" />}>
          <div className="space-y-2">
            <button
              onClick={() => onNavigate("unconfirmed")}
              className="flex w-full items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left hover:bg-amber-100/60 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white">
                <Inbox className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{m.pendingConfirmation} orders to confirm</p>
                <p className="text-[11px] text-muted-foreground">Avg wait: 23 min</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-amber-600" />
            </button>
            <button
              onClick={() => onNavigate("attention")}
              className="flex w-full items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-left hover:bg-red-100/60 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-white">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{attentionCases.filter((c) => c.status === "OPEN").length} attention cases</p>
                <p className="text-[11px] text-muted-foreground">1 urgent · 2 high</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-red-600" />
            </button>
            <button
              onClick={() => onNavigate("returns")}
              className="flex w-full items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-left hover:bg-orange-100/60 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white">
                <Undo2 className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">2 active RTOs</p>
                <p className="text-[11px] text-muted-foreground">Rs 7,000 + shipping at risk</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-orange-600" />
            </button>
            <button
              onClick={() => onNavigate("confirmed")}
              className="flex w-full items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-left hover:bg-sky-100/60 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 text-white">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">3 ready for dispatch</p>
                <p className="text-[11px] text-muted-foreground">Create shipments</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-sky-600" />
            </button>
          </div>
        </SectionCard>
      </div>

      {/* Recent orders */}
      <SectionCard
        title="Recent Orders"
        description="Latest activity across the order lifecycle"
        action={<button onClick={() => onNavigate("unconfirmed")} className="text-xs font-medium text-primary hover:underline">View all →</button>}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">City</th>
                <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">COD</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Courier</th>
                <th className="px-4 py-2.5 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map((o) => (
                <tr
                  key={o.id}
                  onClick={() => onOpenOrder?.(o)}
                  className="cursor-pointer border-t border-border/60 hover:bg-muted/20"
                >
                  <td className="px-4 py-2.5 font-semibold">{o.orderNumber}</td>
                  <td className="px-4 py-2.5">{o.customerName}</td>
                  <td className="hidden px-4 py-2.5 md:table-cell">{o.city}</td>
                  <td className="hidden px-4 py-2.5 text-right tabular-nums sm:table-cell">{formatPKRFull(o.codAmount)}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
                  <td className="hidden px-4 py-2.5 lg:table-cell">{o.courier ? <CourierTag courier={o.courier} /> : <span className="text-xs text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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
