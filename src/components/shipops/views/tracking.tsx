"use client";

import { useState, useMemo } from "react";
import { Truck, MapPin, Package, Clock, CheckCircle2, AlertTriangle, ExternalLink, Copy } from "lucide-react";
import { formatPKRFull, formatDateTime, formatTimeAgo } from "@/lib/format";
import { PageContainer, SectionCard, EmptyState, StatusBadge, CourierTag } from "../shared";
import { LoadingScreen } from "../loading";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/lib/types";

export function TrackingView() {
  const { toast } = useToast();
  // Fetch all orders and filter for transit statuses
  const { data, loading } = useApi<{ orders: Order[]; total: number }>("/api/v1/orders?status=ALL");
  const allOrders = data?.orders || [];
  const inTransit = allOrders.filter((o) => o.status === "IN_TRANSIT" || o.status === "OUT_FOR_DELIVERY" || o.status === "SHIPMENT_CREATED");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (inTransit.length === 0) return null;
    return inTransit.find((o) => o.id === selectedId) || inTransit[0];
  }, [inTransit, selectedId]);

  const copyTracking = (num: string) => {
    toast({ title: "Tracking number copied", description: num });
  };

  if (loading) return <PageContainer><LoadingScreen message="Loading shipments..." /></PageContainer>;

  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* List */}
        <div className="lg:col-span-2">
          <p className="mb-3 text-sm font-semibold">{inTransit.length} active shipments</p>
          <div className="space-y-2 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1">
            {inTransit.length === 0 ? (
              <EmptyState icon={Truck} title="No active shipments" description="Orders in transit will appear here." />
            ) : (
              inTransit.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelectedId(o.id)}
                  className={cn(
                    "w-full rounded-xl border bg-card p-3.5 text-left transition-all hover:shadow-sm",
                    selected?.id === o.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.orderNumber} · {o.city}</p>
                    </div>
                    {o.courier && <CourierTag courier={o.courier} />}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">{o.trackingNumber}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selected && selected.shipment ? (
            <div className="space-y-4">
              {/* Shipment header */}
              <SectionCard>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">{selected.customerName}</h2>
                      {selected.courier && <CourierTag courier={selected.courier} />}
                    </div>
                    <p className="text-sm text-muted-foreground">{selected.orderNumber} · {selected.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatPKRFull(selected.codAmount)}</p>
                    <p className="text-xs text-muted-foreground">COD amount</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Tracking #</span>
                    <span className="font-mono text-sm font-semibold">{selected.trackingNumber}</span>
                  </div>
                  <button onClick={() => copyTracking(selected.trackingNumber!)} className="rounded p-1 hover:bg-muted">
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button className="ml-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    Track on courier site <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </SectionCard>

              {/* Tracking timeline */}
              <SectionCard title="Shipment Timeline" description="Live tracking events from courier">
                <div className="relative">
                  <div className="absolute bottom-4 left-[15px] top-4 w-0.5 bg-border" />
                  <div className="space-y-5">
                    {[...selected.shipment.events].reverse().map((ev, idx) => {
                      const isLast = idx === 0;
                      return (
                        <div key={ev.id} className="relative flex gap-4">
                          <div className={cn(
                            "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
                            ev.isWarning ? "bg-amber-500" : isLast ? "bg-primary" : "bg-emerald-500"
                          )}>
                            {ev.isWarning ? (
                              <AlertTriangle className="h-4 w-4 text-white" />
                            ) : isLast ? (
                              <Truck className="h-4 w-4 text-white" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={cn("text-sm font-semibold", ev.isWarning && "text-amber-700")}>
                                  {ev.status}
                                </p>
                                <p className="text-sm text-muted-foreground">{ev.description}</p>
                                {ev.location && (
                                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {ev.location}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-medium">{formatTimeAgo(ev.eventTime)}</p>
                                <p className="text-[10px] text-muted-foreground">{formatDateTime(ev.eventTime)}</p>
                              </div>
                            </div>
                            <div className="mt-1">
                              <span className={cn(
                                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
                                ev.source === "COURIER" && "bg-orange-100 text-orange-700",
                                ev.source === "SHIPOPS" && "bg-teal-100 text-teal-700",
                                ev.source === "AI" && "bg-violet-100 text-violet-700",
                                ev.source === "CUSTOMER" && "bg-sky-100 text-sky-700"
                              )}>
                                {ev.source === "COURIER" && "Courier"}
                                {ev.source === "SHIPOPS" && "ShipOps"}
                                {ev.source === "AI" && "AI Engine"}
                                {ev.source === "CUSTOMER" && "Customer"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </SectionCard>

              {/* Delivery details */}
              <SectionCard title="Delivery Details">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <Package className="mb-1 h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Items</p>
                    <p className="text-sm font-semibold">{selected.items.length}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <Clock className="mb-1 h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Shipped</p>
                    <p className="text-sm font-semibold">{formatTimeAgo(selected.shipment.shippedAt)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <Truck className="mb-1 h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Shipping Cost</p>
                    <p className="text-sm font-semibold">{formatPKRFull(selected.shipment.shippingCost)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <MapPin className="mb-1 h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Destination</p>
                    <p className="text-sm font-semibold">{selected.city}</p>
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : (
            <EmptyState icon={Truck} title="No active shipments" description="Orders in transit will appear here once dispatched." />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
