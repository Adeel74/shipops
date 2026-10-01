"use client";

import { Activity, Database, ScrollText, UserPlus, CheckCircle2, AlertTriangle } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { LoadingScreen } from "@/components/shipops/loading";
import { formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SystemData {
  health: {
    status: string;
    database: { connected: boolean; latencyMs: number };
    uptime: number;
    version: string;
    environment: string;
  };
  tables: Array<{ name: string; count: number }>;
  activeSessions: number;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    user: { name: string; email: string } | null;
    organization: { name: string } | null;
    createdAt: string;
  }>;
  recentSignups: Array<{
    id: string;
    name: string;
    email: string;
    isSuperAdmin: boolean;
    createdAt: string;
    organization: string | null;
  }>;
}

export function AdminSystem() {
  const { data, loading } = useApi<SystemData>("/api/v1/admin/system");
  if (loading || !data) return <LoadingScreen message="Loading system status..." />;

  const h = data.health;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 lg:p-6">
      {/* Health status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-1 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">System Status</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 capitalize">{h.status}</p>
          <p className="text-xs text-emerald-600/70">v{h.version} · {h.environment}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-1 flex items-center gap-2">
            <Database className="h-4 w-4 text-sky-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">Database</span>
          </div>
          <p className="text-2xl font-bold text-sky-700">{h.database.latencyMs}ms</p>
          <p className="text-xs text-sky-600/70">{h.database.connected ? 'Connected' : 'Disconnected'}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-1 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-violet-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-700">Active Sessions</span>
          </div>
          <p className="text-2xl font-bold text-violet-700">{data.activeSessions}</p>
          <p className="text-xs text-violet-600/70">Users currently logged in</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-1 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Uptime</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{Math.floor(h.uptime / 60)}m</p>
          <p className="text-xs text-amber-600/70">{Math.floor(h.uptime)}s total</p>
        </div>
      </div>

      {/* Database tables */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Database className="h-4 w-4 text-muted-foreground" />
          Database Tables ({data.tables.length})
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {data.tables.map((t) => (
            <div key={t.name} className="rounded-lg border border-border bg-muted/20 p-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t.name}</p>
              <p className="text-lg font-bold tabular-nums">{t.count.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent signups */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            Recent Signups (7d)
          </p>
          <div className="space-y-2">
            {data.recentSignups.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No new signups in last 7 days</p>
            ) : (
              data.recentSignups.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white",
                    u.isSuperAdmin ? "bg-gradient-to-br from-rose-500 to-red-700" : "bg-gradient-to-br from-teal-500 to-emerald-600"
                  )}>
                    {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs">{u.organization || 'No org'}</p>
                    <p className="text-[10px] text-muted-foreground">{formatTimeAgo(u.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent audit logs */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ScrollText className="h-4 w-4 text-muted-foreground" />
            Recent Activity (Platform-wide)
          </p>
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {data.recentAuditLogs.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No activity recorded yet</p>
            ) : (
              data.recentAuditLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
                  <span className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold",
                    log.action.includes('CONFIRM') ? 'bg-emerald-100 text-emerald-700' :
                    log.action.includes('CANCEL') ? 'bg-rose-100 text-rose-700' :
                    log.action.includes('SHIPMENT') ? 'bg-indigo-100 text-indigo-700' :
                    log.action.includes('LOGIN') || log.action.includes('LOGOUT') ? 'bg-zinc-100 text-zinc-700' :
                    log.action.includes('INVITE') ? 'bg-violet-100 text-violet-700' :
                    log.action.includes('BLACKLIST') ? 'bg-red-100 text-red-700' :
                    'bg-sky-100 text-sky-700'
                  )}>
                    {log.action}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">{log.user?.name || 'System'} · {log.organization?.name || '—'}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{formatTimeAgo(log.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
