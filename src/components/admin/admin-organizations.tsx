"use client";

import { useState } from "react";
import { Search, Building2, Ban, CheckCircle2, Trash2, CreditCard, MoreVertical, X, Crown } from "lucide-react";
import { useApi, apiPatch } from "@/hooks/use-api";
import { LoadingScreen } from "@/components/shipops/loading";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AdminOrg {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  timezone: string;
  currency: string;
  status: string;
  createdAt: string;
  owner: { name: string; email: string } | null;
  planId: string | null;
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

interface Plan {
  id: string;
  name: string;
  pricePerMonth: number;
  orderLimit: number;
  memberLimit: number;
}

export function AdminOrganizations() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const { data, loading, refetch } = useApi<{ organizations: AdminOrg[]; total: number }>(
    `/api/v1/admin/organizations${search ? `?q=${encodeURIComponent(search)}` : ""}`
  );
  const { data: plansData } = useApi<{ plans: Plan[] }>("/api/v1/admin/plans");
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [planModal, setPlanModal] = useState<AdminOrg | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");

  const orgs = data?.organizations || [];
  const plans = plansData?.plans || [];

  const handleAction = async (org: AdminOrg, action: string) => {
    setActionMenu(null);
    const res = await apiPatch(`/api/v1/admin/organizations/${org.id}`, { action });
    if (res.success) {
      toast({ title: res.data?.message, description: org.name });
      refetch();
    } else {
      toast({ title: "Failed", description: res.error, variant: "destructive" });
    }
  };

  const handleDelete = async (org: AdminOrg) => {
    setActionMenu(null);
    if (!confirm(`Permanently delete organization "${org.name}"? All orders, customers, and data will be lost.`)) return;
    const res = await fetch(`/api/v1/admin/organizations/${org.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      toast({ title: "Organization deleted", description: org.name });
      refetch();
    } else {
      toast({ title: "Failed", description: json.error?.message, variant: "destructive" });
    }
  };

  const handleAssignPlan = async () => {
    if (!planModal || !selectedPlan) return;
    const res = await apiPatch(`/api/v1/admin/organizations/${planModal.id}`, { planId: selectedPlan });
    if (res.success) {
      toast({ title: res.data?.message, description: planModal.name });
      setPlanModal(null);
      refetch();
    } else {
      toast({ title: "Failed", description: res.error, variant: "destructive" });
    }
  };

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
          placeholder="Search organizations..."
          className="h-10 w-full max-w-md rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Orgs', value: data.total, color: 'text-violet-600' },
          { label: 'Active', value: orgs.filter((o) => o.status === 'ACTIVE').length, color: 'text-emerald-600' },
          { label: 'Suspended', value: orgs.filter((o) => o.status === 'SUSPENDED').length, color: 'text-red-600' },
          { label: 'Total Revenue', value: formatPKR(orgs.reduce((s, o) => s + o.stats.revenue, 0)), color: 'text-teal-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3">
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Org table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Organization</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Owner</th>
                <th className="hidden px-4 py-2.5 text-center font-medium md:table-cell">Status</th>
                <th className="hidden px-4 py-2.5 text-right font-medium md:table-cell">Orders</th>
                <th className="hidden px-4 py-2.5 text-right font-medium lg:table-cell">Revenue</th>
                <th className="hidden px-4 py-2.5 text-center font-medium lg:table-cell">Plan</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => {
                const plan = plans.find((p) => p.id === org.planId);
                return (
                  <tr key={org.id} className={cn(
                    "border-t border-border/60 hover:bg-muted/20",
                    org.status === 'SUSPENDED' && "opacity-60 bg-red-50/30"
                  )}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-[10px] font-bold text-white">
                          {org.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{org.name}</p>
                          <p className="text-xs text-muted-foreground">{org.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-2.5 sm:table-cell">
                      <p className="text-xs font-medium">{org.owner?.name || '—'}</p>
                      <p className="text-[10px] text-muted-foreground">{org.owner?.email}</p>
                    </td>
                    <td className="hidden px-4 py-2.5 text-center md:table-cell">
                      {org.status === 'SUSPENDED' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                          <Ban className="h-2.5 w-2.5" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Active
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-2.5 text-right tabular-nums md:table-cell">{org.stats.totalOrders}</td>
                    <td className="hidden px-4 py-2.5 text-right font-semibold tabular-nums lg:table-cell">{formatPKR(org.stats.revenue)}</td>
                    <td className="hidden px-4 py-2.5 text-center lg:table-cell">
                      {plan ? (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">{plan.name}</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">No plan</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="relative inline-block">
                        <button onClick={() => setActionMenu(actionMenu === org.id ? null : org.id)} className="rounded-md p-1.5 hover:bg-muted">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {actionMenu === org.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />
                            <div className="absolute right-0 top-9 z-50 w-56 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                              <button
                                onClick={() => { setPlanModal(org); setSelectedPlan(org.planId || ''); setActionMenu(null); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
                              >
                                <CreditCard className="h-3.5 w-3.5 text-violet-500" />
                                Assign Plan
                              </button>
                              {org.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => handleAction(org, 'suspend')}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-amber-600 hover:bg-amber-50"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                  Suspend Org
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAction(org, 'activate')}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-emerald-600 hover:bg-emerald-50"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Activate Org
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(org)}
                                className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Org
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan assignment modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPlanModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Assign Plan — {planModal.name}</h3>
              <button onClick={() => setPlanModal(null)} className="rounded p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-2">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors',
                    selectedPlan === p.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.orderLimit} orders/mo · {p.memberLimit} members</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{p.pricePerMonth === 0 ? 'Custom' : formatPKR(p.pricePerMonth)}</p>
                    {selectedPlan === p.id && <Crown className="ml-auto mt-0.5 h-3.5 w-3.5 text-primary" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setPlanModal(null)} className="flex-1 rounded-md border border-border py-2 text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={handleAssignPlan} disabled={!selectedPlan} className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                Assign Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
