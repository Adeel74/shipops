"use client";

import { Building2, Users, Package, Banknote, TrendingUp, Activity, AlertTriangle, Truck, MessageCircle, Database, ScrollText } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { LoadingScreen } from "@/components/shipops/loading";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AdminStats {
  totals: {
    organizations: number;
    users: number;
    orders: number;
    customers: number;
    couriers: number;
    products: number;
    shipments: number;
    openAttentionCases: number;
    whatsappMessages: number;
    auditLogs: number;
    activeStores: number;
    superAdmins: number;
  };
  revenue: { totalRevenue: number; totalShipping: number; netRevenue: number };
  growth: { newUsers7d: number; newOrgs7d: number; newOrders7d: number };
  ordersByStatus: { status: string; count: number }[];
  organizations: Array<{
    id: string; name: string; slug: string; createdAt: string;
    totalOrders: number; totalMembers: number; totalCustomers: number; revenue: number;
  }>;
}

export function AdminDashboard() {
  const { data, loading } = useApi<AdminStats>("/api/v1/admin/stats");
  if (loading || !data) return <LoadingScreen message="Loading platform stats..." />;

  const t = data.totals;
  const kpis = [
    { label: "Organizations", value: t.organizations, sub: `${data.growth.newOrgs7d} new (7d)`, icon: Building2, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Users", value: t.users, sub: `${data.growth.newUsers7d} new (7d)`, icon: Users, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Total Orders", value: t.orders, sub: `${data.growth.newOrders7d} new (7d)`, icon: Package, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Revenue", value: formatPKR(data.revenue.totalRevenue), sub: `${formatPKR(data.revenue.netRevenue)} net`, icon: Banknote, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Customers", value: t.customers, sub: "Across all orgs", icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Shipments", value: t.shipments, sub: `${t.activeStores} active stores`, icon: Truck, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Attention Cases", value: t.openAttentionCases, sub: "Open across platform", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { label: "WhatsApp Msgs", value: t.whatsappMessages, sub: "Total sent/received", icon: MessageCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 lg:p-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", kpi.bg)}>
                  <Icon className={cn("h-4 w-4", kpi.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
              <p className="text-xs font-medium text-foreground/80">{kpi.label}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Orders by status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold">Orders by Status (Platform-wide)</p>
          <div className="space-y-2">
            {data.ordersByStatus.map((s) => {
              const pct = t.orders > 0 ? (s.count / t.orders) * 100 : 0;
              return (
                <div key={s.status}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{s.status.replace(/_/g, ' ')}</span>
                    <span className="text-muted-foreground">{s.count} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top organizations */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold">Organizations by Revenue</p>
          <div className="space-y-2">
            {data.organizations.slice(0, 6).map((org) => (
              <div key={org.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{org.name}</p>
                  <p className="text-xs text-muted-foreground">{org.totalOrders} orders · {org.totalMembers} members</p>
                </div>
                <p className="text-sm font-bold">{formatPKR(org.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Growth stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">New Signups (7d)</span>
          </div>
          <p className="text-3xl font-bold text-emerald-700">{data.growth.newUsers7d}</p>
          <p className="text-xs text-emerald-600/70">{data.growth.newOrgs7d} new organizations</p>
        </div>
        <div className="rounded-xl border border-border bg-gradient-to-br from-sky-50 to-blue-50 p-5">
          <div className="mb-1 flex items-center gap-2">
            <Package className="h-4 w-4 text-sky-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">New Orders (7d)</span>
          </div>
          <p className="text-3xl font-bold text-sky-700">{data.growth.newOrders7d}</p>
          <p className="text-xs text-sky-600/70">Across all organizations</p>
        </div>
        <div className="rounded-xl border border-border bg-gradient-to-br from-violet-50 to-purple-50 p-5">
          <div className="mb-1 flex items-center gap-2">
            <Database className="h-4 w-4 text-violet-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-700">Audit Logs</span>
          </div>
          <p className="text-3xl font-bold text-violet-700">{t.auditLogs}</p>
          <p className="text-xs text-violet-600/70">Total actions tracked</p>
        </div>
      </div>

      {/* All organizations table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-3">
          <p className="text-sm font-semibold">All Organizations ({data.organizations.length})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Organization</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
                <th className="px-4 py-2.5 text-right font-medium">Members</th>
                <th className="px-4 py-2.5 text-right font-medium">Customers</th>
                <th className="px-4 py-2.5 text-right font-medium">Orders</th>
                <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.organizations.map((org) => (
                <tr key={org.id} className="border-t border-border/60 hover:bg-muted/20">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold">{org.name}</p>
                    <p className="text-xs text-muted-foreground">{org.slug}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{org.totalMembers}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{org.totalCustomers}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{org.totalOrders}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{formatPKR(org.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
