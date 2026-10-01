"use client";

import { useState } from "react";
import { Package, Filter } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { LoadingScreen } from "@/components/shipops/loading";
import { formatPKRFull, formatTimeAgo, orderStatusConfig } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  isCod: boolean;
  totalAmount: number;
  riskLevel: string;
  riskScore: number;
  courier: string | null;
  trackingNumber: string | null;
  createdAt: string;
  organization: { id: string; name: string; slug: string };
  customer: { name: string; phone: string | null };
  items: Array<{ title: string; quantity: number; totalPrice: number }>;
}

const statusFilters = ["ALL", "UNCONFIRMED", "CONFIRMED", "IN_TRANSIT", "DELIVERED", "ATTENTION", "RETURNING", "RETURNED", "CANCELLED"];

export function AdminOrders() {
  const [status, setStatus] = useState("ALL");
  const { data, loading } = useApi<{ orders: AdminOrder[]; total: number }>(
    `/api/v1/admin/orders?status=${status}&limit=100`
  );
  if (loading || !data) return <LoadingScreen message="Loading orders..." />;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 lg:p-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {statusFilters.map((f) => (
          <button
            key={f}
            onClick={() => setStatus(f)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium",
              status === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {f === "ALL" ? "All Status" : f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{data.total} orders across all organizations</p>

      {/* Orders table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">Organization</th>
                <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">COD</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Courier</th>
                <th className="hidden px-4 py-2.5 font-medium xl:table-cell">Risk</th>
                <th className="px-4 py-2.5 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => {
                const cfg = orderStatusConfig[o.status as keyof typeof orderStatusConfig] || { label: o.status, bg: 'bg-zinc-50', color: 'text-zinc-600', dot: 'bg-zinc-400' };
                return (
                  <tr key={o.id} className="border-t border-border/60 hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-semibold">{o.orderNumber}</td>
                    <td className="px-4 py-2.5">
                      <p className="text-sm">{o.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{o.customer.phone}</p>
                    </td>
                    <td className="hidden px-4 py-2.5 md:table-cell">
                      <span className="rounded border border-border bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium">
                        {o.organization.name}
                      </span>
                    </td>
                    <td className="hidden px-4 py-2.5 text-right tabular-nums sm:table-cell">{formatPKRFull(o.totalAmount)}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", cfg.bg, cfg.color)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="hidden px-4 py-2.5 lg:table-cell">
                      {o.courier ? (
                        <span className="text-xs font-semibold">{o.courier}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-2.5 xl:table-cell">
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold",
                        o.riskLevel === 'HIGH' ? "bg-red-100 text-red-700" :
                        o.riskLevel === 'MEDIUM' ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                      )}>
                        {o.riskLevel} ({o.riskScore})
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{formatTimeAgo(o.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
