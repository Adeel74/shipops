"use client";

import { useState } from "react";
import { Webhook, CheckCircle2, XCircle, Clock, Filter } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { LoadingScreen } from "@/components/shipops/loading";
import { formatTimeAgo, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface WebhookDelivery {
  id: string;
  source: string;
  eventType: string;
  processed: boolean;
  error: string | null;
  processingTime: number | null;
  receivedAt: string;
  processedAt: string | null;
  payloadSize: number;
}

interface WebhookData {
  deliveries: WebhookDelivery[];
  summary: {
    total: number;
    shopify: number;
    whatsapp: number;
    courier: number;
    processed: number;
    failed: number;
  };
}

const sourceFilters = ["ALL", "SHOPIFY", "WHATSAPP", "COURIER"];

const sourceConfig: Record<string, { label: string; color: string; icon: string }> = {
  SHOPIFY: { label: "Shopify", color: "bg-emerald-100 text-emerald-700", icon: "🛒" },
  WHATSAPP: { label: "WhatsApp", color: "bg-emerald-100 text-emerald-700", icon: "💬" },
  COURIER: { label: "Courier", color: "bg-orange-100 text-orange-700", icon: "📦" },
};

export function AdminWebhooks() {
  const [source, setSource] = useState("ALL");
  const { data, loading } = useApi<WebhookData>(`/api/v1/admin/webhooks?source=${source}&limit=100`);
  if (loading || !data) return <LoadingScreen message="Loading webhook logs..." />;

  const s = data.summary;
  const successRate = s.total > 0 ? Math.round((s.processed / s.total) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 lg:p-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        {[
          { label: 'Total', value: s.total, icon: Webhook, color: 'text-zinc-600' },
          { label: 'Shopify', value: s.shopify, icon: Webhook, color: 'text-emerald-600' },
          { label: 'WhatsApp', value: s.whatsapp, icon: Webhook, color: 'text-teal-600' },
          { label: 'Courier', value: s.courier, icon: Webhook, color: 'text-orange-600' },
          { label: 'Processed', value: s.processed, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Failed', value: s.failed, icon: XCircle, color: 'text-red-600' },
          { label: 'Success Rate', value: `${successRate}%`, icon: Clock, color: 'text-violet-600' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-3">
              <Icon className={cn('mb-1 h-4 w-4', stat.color)} />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {sourceFilters.map((f) => (
          <button
            key={f}
            onClick={() => setSource(f)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium',
              source === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            {f === 'ALL' ? 'All Sources' : f}
          </button>
        ))}
      </div>

      {/* Deliveries table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Source</th>
                <th className="px-4 py-2.5 font-medium">Event Type</th>
                <th className="hidden px-4 py-2.5 text-center font-medium sm:table-cell">Status</th>
                <th className="hidden px-4 py-2.5 text-right font-medium md:table-cell">Payload</th>
                <th className="hidden px-4 py-2.5 text-right font-medium md:table-cell">Time</th>
                <th className="hidden px-4 py-2.5 text-right font-medium lg:table-cell">Processed</th>
                <th className="px-4 py-2.5 text-right font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {data.deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No webhook deliveries yet. Webhooks will appear here when Shopify, WhatsApp, or couriers send events.
                  </td>
                </tr>
              ) : (
                data.deliveries.map((d) => {
                  const src = sourceConfig[d.source] || { label: d.source, color: 'bg-zinc-100 text-zinc-700', icon: '📦' };
                  return (
                    <tr key={d.id} className="border-t border-border/60 hover:bg-muted/20">
                      <td className="px-4 py-2.5">
                        <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold', src.color)}>
                          {src.icon} {src.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{d.eventType}</td>
                      <td className="px-4 py-2.5 text-center">
                        {d.processed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Processed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            <XCircle className="h-2.5 w-2.5" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="hidden px-4 py-2.5 text-right text-xs text-muted-foreground md:table-cell">
                        {(d.payloadSize / 1024).toFixed(1)} KB
                      </td>
                      <td className="hidden px-4 py-2.5 text-right text-xs md:table-cell">
                        {d.processingTime ? `${d.processingTime}ms` : '—'}
                      </td>
                      <td className="hidden px-4 py-2.5 text-right text-xs text-muted-foreground lg:table-cell">
                        {d.processedAt ? formatDateTime(d.processedAt) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                        {formatTimeAgo(d.receivedAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Failed deliveries detail */}
      {data.deliveries.some((d) => !d.processed) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
            <XCircle className="h-4 w-4" />
            Failed Deliveries ({data.deliveries.filter((d) => !d.processed).length})
          </p>
          <div className="space-y-1.5">
            {data.deliveries.filter((d) => !d.processed).slice(0, 5).map((d) => (
              <div key={d.id} className="rounded border border-red-200 bg-white/60 p-2 text-xs">
                <span className="font-mono font-semibold">{d.eventType}</span>
                <span className="text-red-600"> — {d.error || 'Unknown error'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
