"use client";

import { Package, Plus, Check, X, TrendingUp, Truck, Settings as SettingsIcon, ExternalLink } from "lucide-react";
import { formatPKR } from "@/lib/format";
import { PageContainer, SectionCard } from "../shared";
import { LoadingScreen } from "../loading";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { CourierIntegration } from "@/lib/types";

export function CouriersView() {
  const { toast } = useToast();
  const { data, loading } = useApi<{ couriers: CourierIntegration[] }>("/api/v1/couriers");

  if (loading || !data) return <PageContainer><LoadingScreen message="Loading courier integrations..." /></PageContainer>;

  const courierIntegrations = data.couriers;

  return (
    <PageContainer className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Connected", value: courierIntegrations.filter((c) => c.status === "CONNECTED").length, color: "text-emerald-600" },
          { label: "Total Shipments", value: courierIntegrations.reduce((s, c) => s + c.shipmentsCount, 0).toLocaleString(), color: "text-zinc-600" },
          { label: "Avg Delivery Rate", value: "89.4%", color: "text-sky-600" },
          { label: "Monthly Cost", value: formatPKR(courierIntegrations.reduce((s, c) => s + c.shipmentsCount * c.avgCost, 0)), color: "text-orange-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Integrations */}
      <SectionCard
        title="Courier Integrations"
        description="Connect your courier accounts to enable dispatch & tracking"
        action={
          <button
            onClick={() => toast({ title: "Coming soon", description: "Custom courier integration via API" })}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Courier
          </button>
        }
        bodyClassName="p-0"
      >
        <div className="divide-y divide-border">
          {courierIntegrations.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-4 p-4 lg:p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: c.logoColor }}>
                {c.displayName.slice(0, 3).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{c.displayName}</p>
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    c.status === "CONNECTED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                    c.status === "ERROR" ? "border-red-200 bg-red-50 text-red-700" :
                    "border-zinc-200 bg-zinc-50 text-zinc-600"
                  )}>
                    {c.status === "CONNECTED" && <Check className="h-2.5 w-2.5" />}
                    {c.status === "DISCONNECTED" && <X className="h-2.5 w-2.5" />}
                    {c.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                {c.status === "CONNECTED" && (
                  <div className="mt-2 flex flex-wrap gap-4 text-xs">
                    <span className="text-muted-foreground">Account: <span className="font-medium text-foreground">{c.accountName}</span></span>
                    {c.accountNumber && <span className="text-muted-foreground">#: <span className="font-mono text-foreground">{c.accountNumber}</span></span>}
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-semibold text-emerald-600">{c.deliveryRate}%</span> delivery
                    </span>
                    <span className="text-muted-foreground">{c.shipmentsCount.toLocaleString()} shipments</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {c.status === "CONNECTED" ? (
                  <>
                    <button
                      onClick={() => toast({ title: `${c.displayName} settings`, description: "Manage credentials & pickup address" })}
                      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      <SettingsIcon className="h-3.5 w-3.5" />
                      Configure
                    </button>
                    <button
                      onClick={() => toast({ title: "Opening courier portal", description: `Redirecting to ${c.displayName}` })}
                      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Portal
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => toast({ title: "Connecting...", description: `${c.displayName} OAuth flow will start` })}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Routing rules */}
      <SectionCard title="Smart Routing Rules" description="Automatically choose the best courier per order">
        <div className="space-y-3">
          {[
            { condition: "Orders to Karachi", action: "Route via TCS", reason: "92.5% delivery rate, lowest cost" },
            { condition: "Orders > Rs 20,000", action: "Route via Leopards (insured)", reason: "Higher insurance coverage" },
            { condition: "Orders to Faisalabad", action: "Route via Trax", reason: "94% delivery rate in this city" },
            { condition: "Orders < Rs 1,500", action: "Route via Call Courier", reason: "Lowest cost per shipment" },
          ].map((rule, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <Truck className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm"><span className="font-semibold">{rule.condition}</span> → <span className="text-primary font-medium">{rule.action}</span></p>
                <p className="text-xs text-muted-foreground">{rule.reason}</p>
              </div>
              <button className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
