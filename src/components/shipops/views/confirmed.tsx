"use client";

import { useState } from "react";
import { Truck, CheckCircle2, MapPin, Package, Phone, MessageCircle, ArrowRight, Store } from "lucide-react";
import { orders, courierIntegrations } from "@/lib/mock-data";
import { formatPKRFull, formatTimeAgo } from "@/lib/format";
import { PageContainer, SectionCard, EmptyState, CourierTag } from "../shared";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Order, CourierProvider } from "@/lib/types";

export function ConfirmedView() {
  const { toast } = useToast();
  const confirmed = orders.filter((o) => o.status === "CONFIRMED");
  const [selected, setSelected] = useState<Order | null>(confirmed[0] || null);
  const [dispatching, setDispatching] = useState(false);

  const handleCreateShipment = (order: Order, courier: CourierProvider) => {
    setDispatching(true);
    setTimeout(() => {
      setDispatching(false);
      toast({
        title: `Shipment created with ${courier}`,
        description: `Order ${order.orderNumber} → ${courier}. Tracking number will appear shortly.`,
      });
    }, 800);
  };

  const checklist = [
    { label: "Customer confirmed", done: true },
    { label: "Address verified", done: true },
    { label: "Ready for courier", done: true },
  ];

  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* List */}
        <div className="lg:col-span-2">
          <p className="mb-3 text-sm font-semibold">{confirmed.length} ready for dispatch</p>
          <div className="space-y-2 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1">
            {confirmed.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No confirmed orders" description="Confirmed orders will appear here." />
            ) : (
              confirmed.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className={cn(
                    "w-full rounded-xl border bg-card p-3.5 text-left transition-all hover:shadow-sm",
                    selected?.id === o.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.orderNumber} · {o.city}</p>
                    </div>
                    <span className="text-sm font-bold">{formatPKRFull(o.codAmount)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Package className="h-3 w-3" />{o.items.length} item(s)</span>
                    <span>Confirmed {formatTimeAgo(o.confirmedAt || o.createdAt)}</span>
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
              <SectionCard>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{selected.customerName}</h2>
                    <p className="text-sm text-muted-foreground">{selected.orderNumber} · Confirmed {formatTimeAgo(selected.confirmedAt || selected.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatPKRFull(selected.codAmount)}</p>
                    <p className="text-xs text-muted-foreground">COD amount</p>
                  </div>
                </div>

                {/* Readiness checklist */}
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {checklist.map((c) => (
                    <div key={c.label} className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-800">{c.label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{selected.customerPhone}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">City</p>
                    <p className="flex items-center gap-1.5 text-sm font-medium"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{selected.city}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3 sm:col-span-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Shipping Address</p>
                    <p className="text-sm">{selected.address}</p>
                  </div>
                </div>
              </SectionCard>

              {/* Items */}
              <SectionCard title="Order Items">
                <div className="space-y-2">
                  {selected.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">SKU: {item.sku} · Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">{formatPKRFull(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Create shipment */}
              <SectionCard title="Create Shipment" description="Select a courier to dispatch this order">
                <div className="space-y-2">
                  {courierIntegrations.filter((c) => c.status === "CONNECTED").map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleCreateShipment(selected, c.provider)}
                      disabled={dispatching}
                      className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left hover:border-primary hover:bg-muted/30 transition-colors disabled:opacity-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-xs" style={{ backgroundColor: c.logoColor }}>
                        {c.displayName.slice(0, 3)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{c.displayName}</p>
                        <p className="text-xs text-muted-foreground">{c.deliveryRate}% delivery rate · {formatPKRFull(c.avgCost)} avg cost</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Est. cost</p>
                        <p className="text-sm font-semibold">{formatPKRFull(c.avgCost)}</p>
                      </div>
                      {dispatching ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
                    <MessageCircle className="h-4 w-4" />
                    Notify Customer
                  </button>
                  <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100">
                    <Phone className="h-4 w-4" />
                    Call Customer
                  </button>
                </div>
              </SectionCard>
            </div>
          ) : (
            <EmptyState icon={Truck} title="Select an order" description="Choose a confirmed order to create a shipment." />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
