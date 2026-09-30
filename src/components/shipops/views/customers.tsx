"use client";

import { useState } from "react";
import { Users, MapPin, Phone, Mail, Package, TrendingUp, TrendingDown, Search, Sparkles, AlertTriangle, MessageCircle } from "lucide-react";
import { customers, orders } from "@/lib/mock-data";
import { formatPKRFull, formatTimeAgo, riskLevelConfig } from "@/lib/format";
import { PageContainer, SectionCard, EmptyState, RiskBadge, RiskMeter, StatusBadge, CourierTag } from "../shared";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/types";

export function CustomersView() {
  const [selected, setSelected] = useState<Customer | null>(customers[0] || null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");

  const filtered = customers.filter((c) => {
    const matchesSearch = !search || `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.city.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = riskFilter === "ALL" || c.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const customerOrders = selected ? orders.filter((o) => o.customerId === selected.id) : [];
  const deliveryRate = selected ? Math.round((selected.deliveredOrders / selected.totalOrders) * 100) : 0;
  const rtoRate = selected ? Math.round((selected.returnedOrders / selected.totalOrders) * 100) : 0;

  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* List */}
        <div className="lg:col-span-2">
          <div className="mb-3 space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, city..."
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div className="flex items-center gap-1">
              {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setRiskFilter(f)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium",
                    riskFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {f === "ALL" ? "All Risk" : f}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto lg:pr-1">
            {filtered.length === 0 ? (
              <EmptyState icon={Users} title="No customers found" description="Try a different search or filter." />
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={cn(
                    "w-full rounded-xl border bg-card p-3.5 text-left transition-all hover:shadow-sm",
                    selected?.id === c.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white",
                        c.riskLevel === "HIGH" ? "bg-red-500" : c.riskLevel === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"
                      )}>
                        {c.firstName[0]}{c.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-muted-foreground">{c.city} · {c.phone}</p>
                      </div>
                    </div>
                    <RiskBadge level={c.riskLevel} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{c.totalOrders} orders · {c.deliveredOrders} delivered</span>
                    <span>{Math.round((c.deliveredOrders / c.totalOrders) * 100)}% delivery</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="space-y-4">
              {/* Profile */}
              <SectionCard>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white",
                      selected.riskLevel === "HIGH" ? "bg-red-500" : selected.riskLevel === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"
                    )}>
                      {selected.firstName[0]}{selected.lastName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold">{selected.firstName} {selected.lastName}</h2>
                        <RiskBadge level={selected.riskLevel} score={selected.riskScore} />
                      </div>
                      <p className="text-sm text-muted-foreground">Customer since {new Date(selected.joinedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><Phone className="h-3 w-3" />Phone</p>
                    <p className="text-sm font-medium">{selected.phone}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><Mail className="h-3 w-3" />Email</p>
                    <p className="text-sm font-medium">{selected.email || "—"}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3 sm:col-span-2">
                    <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><MapPin className="h-3 w-3" />Address</p>
                    <p className="text-sm font-medium">{selected.address}</p>
                  </div>
                </div>
              </SectionCard>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <Package className="mb-1 h-4 w-4 text-zinc-500" />
                  <p className="text-2xl font-bold">{selected.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <TrendingUp className="mb-1 h-4 w-4 text-emerald-600" />
                  <p className="text-2xl font-bold text-emerald-700">{selected.deliveredOrders}</p>
                  <p className="text-xs text-emerald-700/70">Delivered ({deliveryRate}%)</p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <TrendingDown className="mb-1 h-4 w-4 text-rose-600" />
                  <p className="text-2xl font-bold text-rose-700">{selected.returnedOrders}</p>
                  <p className="text-xs text-rose-700/70">Returned ({rtoRate}%)</p>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                  <Sparkles className="mb-1 h-4 w-4 text-violet-600" />
                  <p className="text-2xl font-bold text-violet-700">{formatPKRFull(selected.lastOrderAmount || 0)}</p>
                  <p className="text-xs text-violet-700/70">Last Order</p>
                </div>
              </div>

              {/* Risk analysis */}
              <SectionCard title="Customer Risk Profile" description="AI-computed risk based on history" action={<Sparkles className="h-4 w-4 text-violet-500" />}>
                <div className="flex items-center justify-between rounded-lg bg-violet-50 p-3">
                  <div>
                    <p className="text-sm font-semibold text-violet-900">Risk Score</p>
                    <p className="text-xs text-violet-700/70">Composite of RTO rate, response time, order value</p>
                  </div>
                  <RiskMeter score={selected.riskScore} />
                </div>
                {selected.riskLevel === "HIGH" && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">High RTO Risk</p>
                      <p className="text-xs text-red-700">This customer has a {rtoRate}% return rate. Consider requiring advance payment or phone verification for future orders.</p>
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Order history */}
              <SectionCard title="Order History" description={`${customerOrders.length} orders with your store`}>
                {customerOrders.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No orders in current dataset.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th className="pb-2 font-medium">Order</th>
                          <th className="pb-2 text-right font-medium">Amount</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="hidden pb-2 font-medium sm:table-cell">Courier</th>
                          <th className="pb-2 text-right font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerOrders.map((o) => (
                          <tr key={o.id} className="border-b border-border/60 last:border-0">
                            <td className="py-2.5 font-semibold">{o.orderNumber}</td>
                            <td className="py-2.5 text-right tabular-nums">{formatPKRFull(o.codAmount)}</td>
                            <td className="py-2.5"><StatusBadge status={o.status} /></td>
                            <td className="hidden py-2.5 sm:table-cell">{o.courier ? <CourierTag courier={o.courier} /> : <span className="text-xs text-muted-foreground">—</span>}</td>
                            <td className="py-2.5 text-right text-xs text-muted-foreground">{formatTimeAgo(o.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>

              {/* Quick actions */}
              <div className="flex gap-2">
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
                  <MessageCircle className="h-4 w-4" />
                  Message on WhatsApp
                </button>
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 py-2.5 text-sm font-medium text-sky-700 hover:bg-sky-100">
                  <Phone className="h-4 w-4" />
                  Call Customer
                </button>
              </div>
            </div>
          ) : (
            <EmptyState icon={Users} title="Select a customer" description="Choose a customer from the left to view their profile and order history." />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
