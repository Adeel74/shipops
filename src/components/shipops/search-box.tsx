"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Package, User, Truck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewKey } from "@/lib/types";

interface SearchResult {
  results: {
    orders: Array<{
      id: string;
      orderNumber: string;
      customerName: string;
      city: string;
      status: string;
      codAmount: number;
    }>;
    customers: Array<{
      id: string;
      name: string;
      phone: string;
      email: string;
      riskLevel: string;
      totalOrders: number;
    }>;
    shipments: Array<{
      id: string;
      trackingNumber: string;
      status: string;
      orderNumber: string;
      customerName: string;
    }>;
  };
}

interface SearchBoxProps {
  onNavigate: (view: ViewKey) => void;
  onOpenOrder?: (orderId: string) => void;
}

export function SearchBox({ onNavigate, onOpenOrder }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult["results"] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data.results);
          setOpen(true);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasResults = results && (results.orders.length > 0 || results.customers.length > 0 || results.shipments.length > 0);

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results && setOpen(true)}
        placeholder="Search orders, customers, tracking..."
        className="h-9 w-64 rounded-md border border-input bg-muted/40 pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/20 lg:w-72"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {open && query.length >= 2 && (
        <div className="absolute left-0 top-11 z-50 w-96 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          {!hasResults && !loading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {/* Orders */}
              {results!.orders.length > 0 && (
                <div>
                  <p className="border-b border-border bg-muted/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Orders ({results!.orders.length})
                  </p>
                  {results!.orders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => {
                        onOpenOrder?.(o.id);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="flex w-full items-center gap-3 border-b border-border/60 px-3 py-2 text-left hover:bg-muted/30"
                    >
                      <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{o.orderNumber} · {o.customerName}</p>
                        <p className="text-xs text-muted-foreground">{o.city} · Rs {o.codAmount.toLocaleString()} · {o.status}</p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              {/* Customers */}
              {results!.customers.length > 0 && (
                <div>
                  <p className="border-b border-border bg-muted/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Customers ({results!.customers.length})
                  </p>
                  {results!.customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onNavigate("customers");
                        setOpen(false);
                        setQuery("");
                      }}
                      className="flex w-full items-center gap-3 border-b border-border/60 px-3 py-2 text-left hover:bg-muted/30"
                    >
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.phone} · {c.totalOrders} orders · {c.riskLevel} risk</p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              {/* Shipments */}
              {results!.shipments.length > 0 && (
                <div>
                  <p className="border-b border-border bg-muted/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Shipments ({results!.shipments.length})
                  </p>
                  {results!.shipments.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onNavigate("tracking");
                        setOpen(false);
                        setQuery("");
                      }}
                      className="flex w-full items-center gap-3 border-b border-border/60 px-3 py-2 text-left hover:bg-muted/30"
                    >
                      <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{s.trackingNumber}</p>
                        <p className="text-xs text-muted-foreground">{s.orderNumber} · {s.customerName} · {s.status}</p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
