"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { Search, Package, Truck, CheckCircle2, MapPin, Clock, AlertTriangle, ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackingData {
  trackingNumber: string;
  courier: string | null;
  status: string;
  statusLabel: string;
  statusStep: number;
  statusColor: string;
  orderNumber: string;
  organization: string;
  customerName: string;
  city: string;
  codAmount: number;
  isCod: boolean;
  currency: string;
  items: Array<{ title: string; quantity: number; totalPrice: number }>;
  shippedAt: string | null;
  deliveredAt: string | null;
  estimatedDelivery: string | null;
  events: Array<{
    id: string;
    status: string;
    description: string;
    location: string | null;
    eventTime: string;
    source: string;
    isWarning: boolean;
  }>;
}

const stepIcons = [
  { icon: Package, label: "Confirmed", desc: "Order confirmed" },
  { icon: Truck, label: "In Transit", desc: "On the way" },
  { icon: MapPin, label: "Out for Delivery", desc: "Arriving today" },
  { icon: CheckCircle2, label: "Delivered", desc: "Package delivered" },
];

const courierColors: Record<string, string> = {
  TCS: "#E63946",
  LEOPARDS: "#F4A261",
  TRAX: "#2A9D8F",
  "M&P": "#6A4C93",
  POSTEX: "#1D3557",
  CALL_COURIER: "#457B9D",
};

export default function TrackingPage({ params }: { params: Promise<{ trackingNumber: string }> }) {
  const { trackingNumber } = use(params);
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(trackingNumber);

  useEffect(() => {
    if (!trackingNumber) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetch(`/api/v1/public/track?tracking=${encodeURIComponent(trackingNumber)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error?.message || "Tracking number not found");
          setData(null);
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [trackingNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/track/${encodeURIComponent(searchInput.trim())}`;
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 text-white">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold">ShipOps</p>
              <p className="text-[10px] text-muted-foreground">Order Tracking</p>
            </div>
          </a>
          <a href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Store
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter tracking number (e.g., TCS-78451236)"
                className="h-12 w-full rounded-lg border border-input bg-white pl-11 pr-4 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <button type="submit" className="h-12 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Track
            </button>
          </form>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-3 text-sm text-muted-foreground">Tracking your order...</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
            <p className="mb-1 text-lg font-semibold text-amber-800">{error}</p>
            <p className="text-sm text-amber-700">
              Please check your tracking number and try again. If the problem persists, contact the store.
            </p>
          </div>
        )}

        {data && !loading && !error && (
          <div className="space-y-4">
            {/* Status banner */}
            <div className={cn(
              "rounded-xl border-2 p-5",
              data.statusColor === 'emerald' && "border-emerald-300 bg-emerald-50",
              data.statusColor === 'indigo' && "border-indigo-300 bg-indigo-50",
              data.statusColor === 'blue' && "border-blue-300 bg-blue-50",
              data.statusColor === 'sky' && "border-sky-300 bg-sky-50",
              data.statusColor === 'amber' && "border-amber-300 bg-amber-50",
              data.statusColor === 'orange' && "border-orange-300 bg-orange-50",
              data.statusColor === 'rose' && "border-rose-300 bg-rose-50",
              data.statusColor === 'zinc' && "border-zinc-300 bg-zinc-50",
            )}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Tracking Number</p>
                  <p className="font-mono text-lg font-bold">{data.trackingNumber}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {data.orderNumber} · {data.organization}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-2xl font-bold",
                    data.statusColor === 'emerald' && "text-emerald-700",
                    data.statusColor === 'indigo' && "text-indigo-700",
                    data.statusColor === 'blue' && "text-blue-700",
                    data.statusColor === 'sky' && "text-sky-700",
                    data.statusColor === 'amber' && "text-amber-700",
                    data.statusColor === 'orange' && "text-orange-700",
                    data.statusColor === 'rose' && "text-rose-700",
                    data.statusColor === 'zinc' && "text-zinc-700",
                  )}>{data.statusLabel}</p>
                  {data.courier && (
                    <span
                      className="mt-1 inline-block rounded px-2 py-0.5 text-xs font-bold text-white"
                      style={{ backgroundColor: courierColors[data.courier] || '#8D99AE' }}
                    >
                      {data.courier}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress steps */}
            {data.statusStep > 0 && (
              <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  {stepIcons.map((step, i) => {
                    const Icon = step.icon;
                    const isCompleted = i < data.statusStep;
                    const isCurrent = i === data.statusStep - 1;
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center">
                        <div className="flex w-full items-center">
                          {i > 0 && (
                            <div className={cn("h-0.5 flex-1", i <= data.statusStep - 1 ? "bg-emerald-500" : "bg-muted")} />
                          )}
                          <div className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                            isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted bg-white text-muted-foreground"
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          {i < stepIcons.length - 1 && (
                            <div className={cn("h-0.5 flex-1", i < data.statusStep - 1 ? "bg-emerald-500" : "bg-muted")} />
                          )}
                        </div>
                        <p className={cn(
                          "mt-1.5 text-center text-[10px] font-medium",
                          isCompleted ? "text-emerald-700" : "text-muted-foreground"
                        )}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery Details</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="font-medium">{data.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">City</span>
                    <span className="flex items-center gap-1 font-medium"><MapPin className="h-3 w-3" />{data.city}</span>
                  </div>
                  {data.isCod && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">COD Amount</span>
                      <span className="font-bold text-emerald-700">{data.currency} {data.codAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {data.shippedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipped</span>
                      <span className="text-xs">{formatDate(data.shippedAt)}</span>
                    </div>
                  )}
                  {data.estimatedDelivery && data.statusStep < 4 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. Delivery</span>
                      <span className="text-xs font-medium">{formatDate(data.estimatedDelivery)}</span>
                    </div>
                  )}
                  {data.deliveredAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivered</span>
                      <span className="text-xs font-medium text-emerald-700">{formatDate(data.deliveredAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items ({data.items.length})</p>
                <div className="space-y-1.5">
                  {data.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} · {data.currency} {item.totalPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold">Tracking History</p>
              <div className="relative">
                <div className="absolute bottom-4 left-[15px] top-4 w-0.5 bg-border" />
                <div className="space-y-4">
                  {data.events.map((ev, idx) => {
                    const isLast = idx === 0;
                    return (
                      <div key={ev.id} className="relative flex gap-4">
                        <div className={cn(
                          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white",
                          ev.isWarning ? "bg-amber-500" : isLast ? "bg-primary" : "bg-emerald-500"
                        )}>
                          {ev.isWarning ? <AlertTriangle className="h-4 w-4 text-white" /> :
                           isLast ? <Truck className="h-4 w-4 text-white" /> :
                           <CheckCircle2 className="h-4 w-4 text-white" />}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={cn("text-sm font-semibold", ev.isWarning && "text-amber-700")}>{ev.status}</p>
                              <p className="text-sm text-muted-foreground">{ev.description}</p>
                              {ev.location && (
                                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />{ev.location}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium">{formatTime(ev.eventTime)}</p>
                              <span className={cn(
                                "rounded px-1.5 py-0.5 text-[9px] font-medium",
                                ev.source === "COURIER" && "bg-orange-100 text-orange-700",
                                ev.source === "SHIPOPS" && "bg-teal-100 text-teal-700",
                                ev.source === "AI" && "bg-violet-100 text-violet-700",
                                ev.source === "CUSTOMER" && "bg-sky-100 text-sky-700"
                              )}>{ev.source}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="rounded-xl border border-border bg-white p-4 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">Need help with your order?</p>
              <div className="mt-2 flex justify-center gap-3">
                <button className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Support
                </button>
                <button className="flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100">
                  <Phone className="h-4 w-4" />
                  Call Store
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by <span className="font-semibold text-foreground">ShipOps</span> · COD Operations Cloud
        </p>
      </footer>
    </div>
  );
}
