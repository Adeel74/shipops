"use client";

import { useState } from "react";
import { CreditCard, Plus, Pencil, Trash2, Check, X, Loader2, Users } from "lucide-react";
import { useApi, apiPost, apiPatch } from "@/hooks/use-api";
import { LoadingScreen } from "@/components/shipops/loading";
import { formatPKRFull } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  pricePerMonth: number;
  orderLimit: number;
  memberLimit: number;
  courierLimit: number;
  features: string[];
  isActive: boolean;
  organizationCount: number;
  createdAt: string;
}

export function AdminPlans() {
  const { toast } = useToast();
  const { data, loading, refetch } = useApi<{ plans: Plan[] }>("/api/v1/admin/plans");
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', pricePerMonth: '', orderLimit: '500',
    memberLimit: '3', courierLimit: '1', features: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      pricePerMonth: parseFloat(form.pricePerMonth) || 0,
      orderLimit: parseInt(form.orderLimit) || 500,
      memberLimit: parseInt(form.memberLimit) || 3,
      courierLimit: parseInt(form.courierLimit) || 1,
      features: form.features.split('\n').filter((f) => f.trim()),
    };

    const res = editing
      ? await apiPatch(`/api/v1/admin/plans/${editing.id}`, payload)
      : await apiPost("/api/v1/admin/plans", payload);

    setSaving(false);
    if (res.success) {
      toast({ title: editing ? "Plan updated" : "Plan created", description: form.name });
      setEditing(null);
      setCreating(false);
      setForm({ name: '', description: '', pricePerMonth: '', orderLimit: '500', memberLimit: '3', courierLimit: '1', features: '' });
      refetch();
    } else {
      toast({ title: "Failed", description: res.error, variant: "destructive" });
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    const res = await apiPatch(`/api/v1/admin/plans/${plan.id}`, { isActive: !plan.isActive });
    if (res.success) {
      toast({ title: plan.isActive ? "Plan deactivated" : "Plan activated", description: plan.name });
      refetch();
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (plan.organizationCount > 0) {
      toast({ title: "Cannot delete", description: `${plan.organizationCount} organization(s) are on this plan. Reassign first.`, variant: "destructive" });
      return;
    }
    if (!confirm(`Delete plan "${plan.name}"?`)) return;
    const res = await fetch(`/api/v1/admin/plans/${plan.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      toast({ title: "Plan deleted", description: plan.name });
      refetch();
    } else {
      toast({ title: "Failed", description: json.error?.message, variant: "destructive" });
    }
  };

  const startEdit = (plan: Plan) => {
    setEditing(plan);
    setCreating(false);
    setForm({
      name: plan.name,
      description: plan.description || '',
      pricePerMonth: plan.pricePerMonth.toString(),
      orderLimit: plan.orderLimit.toString(),
      memberLimit: plan.memberLimit.toString(),
      courierLimit: plan.courierLimit.toString(),
      features: plan.features.join('\n'),
    });
  };

  if (loading || !data) return <LoadingScreen message="Loading plans..." />;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{data.plans.length} subscription plans</p>
        </div>
        <button
          onClick={() => { setCreating(true); setEditing(null); setForm({ name: '', description: '', pricePerMonth: '', orderLimit: '500', memberLimit: '3', courierLimit: '1', features: '' }); }}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          New Plan
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.plans.map((plan) => (
          <div key={plan.id} className={cn(
            "rounded-xl border bg-card p-5 shadow-sm",
            !plan.isActive && "opacity-60"
          )}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-lg font-bold">{plan.name}</p>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </div>
              {plan.organizationCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <Users className="h-2.5 w-2.5" />
                  {plan.organizationCount}
                </span>
              )}
            </div>

            <p className="mb-3 text-3xl font-bold">
              {plan.pricePerMonth === 0 ? 'Custom' : formatPKRFull(plan.pricePerMonth)}
              {plan.pricePerMonth > 0 && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
            </p>

            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-border bg-muted/20 p-2">
                <p className="text-sm font-bold">{plan.orderLimit.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">Orders/mo</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-2">
                <p className="text-sm font-bold">{plan.memberLimit}</p>
                <p className="text-[9px] text-muted-foreground">Members</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-2">
                <p className="text-sm font-bold">{plan.courierLimit}</p>
                <p className="text-[9px] text-muted-foreground">Couriers</p>
              </div>
            </div>

            <ul className="mb-4 space-y-1">
              {plan.features.slice(0, 4).map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                  <span>{f}</span>
                </li>
              ))}
              {plan.features.length > 4 && (
                <li className="text-xs text-muted-foreground">+{plan.features.length - 4} more</li>
              )}
            </ul>

            <div className="flex gap-1.5 border-t border-border pt-3">
              <button
                onClick={() => startEdit(plan)}
                className="flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                onClick={() => handleToggleActive(plan)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium",
                  plan.isActive ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                )}
              >
                {plan.isActive ? <><X className="h-3 w-3" /> Deactivate</> : <><Check className="h-3 w-3" /> Activate</>}
              </button>
              <button
                onClick={() => handleDelete(plan)}
                className="flex items-center justify-center gap-1 rounded-md border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit modal */}
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setCreating(false); setEditing(null); }}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-bold">{editing ? 'Edit Plan' : 'Create New Plan'}</h3>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Plan Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Growth" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Price / Month (Rs)</label>
                  <input type="number" value={form.pricePerMonth} onChange={(e) => setForm({ ...form, pricePerMonth: e.target.value })} placeholder="6500" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Growing stores up to 3,000 orders/month" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Order Limit</label>
                  <input type="number" value={form.orderLimit} onChange={(e) => setForm({ ...form, orderLimit: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Member Limit</label>
                  <input type="number" value={form.memberLimit} onChange={(e) => setForm({ ...form, memberLimit: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Courier Limit</label>
                  <input type="number" value={form.courierLimit} onChange={(e) => setForm({ ...form, courierLimit: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Features (one per line)</label>
                <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={5} placeholder={"Shopify sync\nWhatsApp confirmations\nAll couriers\nAI risk engine"} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
              <button onClick={() => { setCreating(false); setEditing(null); }} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
