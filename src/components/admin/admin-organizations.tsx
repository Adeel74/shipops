"use client";

import { useState } from "react";
import { Search, Building2, ExternalLink, Users, Package, Banknote } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { LoadingScreen } from "@/components/shipops/loading";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AdminOrg {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  timezone: string;
  currency: string;
  createdAt: string;
  owner: { name: string; email: string } | null;
  stores: Array<{ id: string; shopDomain: string; status: string; platform: string }>;
  stats: {
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    totalCouriers: number;
    deliveredOrders: number;
    revenue: number;
  };
}

export function AdminOrganizations() {
  const [search, setSearch] = useState("");
  const { data, loading } = useApi<{ organizations: AdminOrg[]; total: number }>(
    `/api/v1/admin/organizations${search ? `?q=${encodeURIComponent(search)}` : ""}`
  );
  if (loading || !data) return <LoadingScreen message="Loading organizations..." />;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 lg:p-6">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search organizations by name or slug..."
          className="h-10 w-full max-w-md rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Orgs", value: data.total, icon: Building2, color: "text-violet-600" },
          { label: "Total Members", value: data.organizations.reduce((s, o) => s + o.stats.totalOrders, 0), icon: Users, color: "text-sky-600" },
          { label: "Total Orders", value: data.organizations.reduce((s, o) => s + o.stats.totalOrders, 0), icon: Package, color: "text-emerald-600" },
          { label: "Total Revenue", value: formatPKR(data.organizations.reduce((s, o) => s + o.stats.revenue, 0)), icon: Banknote, color: "text-teal-600" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-lg border border-border bg-card p-3">
              <Icon className={cn("mb-1 h-4 w-4", s.color)} />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Org cards */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {data.organizations.map((org) => (
          <div key={org.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-xs font-bold text-white">
                    {org.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{org.name}</p>
                    <p className="text-xs text-muted-foreground">{org.slug}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-sm font-bold text-emerald-600">{formatPKR(org.stats.revenue)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-border bg-muted/20 p-2">
                <p className="text-lg font-bold">{org.stats.totalOrders}</p>
                <p className="text-[10px] text-muted-foreground">Orders</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-2">
                <p className="text-lg font-bold">{org.stats.totalCustomers}</p>
                <p className="text-[10px] text-muted-foreground">Customers</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-2">
                <p className="text-lg font-bold">{org.stats.deliveredOrders}</p>
                <p className="text-[10px] text-muted-foreground">Delivered</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
              <div>
                <p className="text-[10px] text-muted-foreground">Owner</p>
                <p className="text-xs font-medium">{org.owner?.name || '—'} · {org.owner?.email || ''}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Joined</p>
                <p className="text-xs">{new Date(org.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            {org.stores.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 border-t border-border pt-2">
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{org.stores[0].shopDomain}</span>
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                  org.stores[0].status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                )}>{org.stores[0].status}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
