"use client";

import { useState } from "react";
import { ScrollText, LogIn, UserPlus, Package, CreditCard, Building2, Activity, Monitor } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { LoadingScreen } from "@/components/shipops/loading";
import { formatTimeAgo, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ActivityData {
  logs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    user: { name: string; email: string } | null;
    organization: { name: string } | null;
    oldData: unknown;
    newData: unknown;
    createdAt: string;
  }>;
  activeSessions: Array<{
    id: string;
    createdAt: string;
    expiresAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      isSuperAdmin: boolean;
      organization: string | null;
    };
  }>;
  summary: {
    totalLogins: number;
    totalSignups: number;
    totalOrderActions: number;
    totalShipments: number;
    totalPlanChanges: number;
    totalUserActions: number;
    activeSessionCount: number;
  };
}

const filters = [
  { key: 'all', label: 'All Activity' },
  { key: 'logins', label: 'Logins' },
  { key: 'orders', label: 'Orders' },
  { key: 'users', label: 'Users' },
  { key: 'plans', label: 'Plans' },
  { key: 'orgs', label: 'Organizations' },
];

function getActionIcon(action: string) {
  if (action.includes('LOGIN')) return { icon: LogIn, color: 'text-sky-600 bg-sky-100' };
  if (action.includes('LOGOUT')) return { icon: LogIn, color: 'text-zinc-600 bg-zinc-100' };
  if (action.includes('SIGNUP')) return { icon: UserPlus, color: 'text-emerald-600 bg-emerald-100' };
  if (action.includes('ORDER') || action.includes('SHIPMENT')) return { icon: Package, color: 'text-indigo-600 bg-indigo-100' };
  if (action.includes('PLAN')) return { icon: CreditCard, color: 'text-violet-600 bg-violet-100' };
  if (action.includes('ORG') || action.includes('COURIER')) return { icon: Building2, color: 'text-amber-600 bg-amber-100' };
  if (action.includes('USER') || action.includes('TEAM') || action.includes('CUSTOMER')) return { icon: UserPlus, color: 'text-rose-600 bg-rose-100' };
  return { icon: Activity, color: 'text-zinc-600 bg-zinc-100' };
}

export function AdminActivity() {
  const [filter, setFilter] = useState('all');
  const { data, loading } = useApi<ActivityData>(`/api/v1/admin/activity?filter=${filter}&limit=100`);
  if (loading || !data) return <LoadingScreen message="Loading activity..." />;

  const s = data.summary;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 lg:p-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        {[
          { label: 'Total Logins', value: s.totalLogins, icon: LogIn, color: 'text-sky-600' },
          { label: 'Signups', value: s.totalSignups, icon: UserPlus, color: 'text-emerald-600' },
          { label: 'Order Actions', value: s.totalOrderActions, icon: Package, color: 'text-indigo-600' },
          { label: 'Shipments', value: s.totalShipments, icon: Package, color: 'text-violet-600' },
          { label: 'Plan Changes', value: s.totalPlanChanges, icon: CreditCard, color: 'text-amber-600' },
          { label: 'User Actions', value: s.totalUserActions, icon: UserPlus, color: 'text-rose-600' },
          { label: 'Active Sessions', value: s.activeSessionCount, icon: Monitor, color: 'text-teal-600' },
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
      <div className="flex flex-wrap items-center gap-2">
        <ScrollText className="h-4 w-4 text-muted-foreground" />
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium',
              filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Activity log */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Activity Feed ({data.logs.length})</p>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {data.logs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No activity recorded</p>
              ) : (
                data.logs.map((log) => {
                  const { icon: Icon, color } = getActionIcon(log.action);
                  return (
                    <div key={log.id} className="flex gap-3 border-b border-border/60 p-3 last:border-0 hover:bg-muted/20">
                      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{log.action.replace(/_/g, ' ')}</p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">{formatTimeAgo(log.createdAt)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {log.user?.name || 'System'}
                          {log.organization && ` · ${log.organization.name}`}
                          {' · '}
                          <span className="font-mono">{log.entityType}</span>
                        </p>
                        {log.newData && typeof log.newData === 'object' && (
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground/70">
                            {JSON.stringify(log.newData).slice(0, 120)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Active sessions */}
        <div>
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Active Sessions ({data.activeSessions.length})</p>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {data.activeSessions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No active sessions</p>
              ) : (
                data.activeSessions.map((session) => (
                  <div key={session.id} className="border-b border-border/60 p-3 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white',
                        session.user.isSuperAdmin ? 'bg-gradient-to-br from-rose-500 to-red-700' : 'bg-gradient-to-br from-teal-500 to-emerald-600'
                      )}>
                        {session.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{session.user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                      </div>
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Online
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{session.user.organization || 'No org'}</span>
                      <span>Since {formatDateTime(session.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
