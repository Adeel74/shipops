"use client";

import { Menu, Search, Bell, ChevronDown, Store, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { UserRole, ViewKey } from "@/lib/types";
import { userRoleConfig, formatTimeAgo } from "@/lib/format";
import { useApi } from "@/hooks/use-api";
import { SearchBox } from "./search-box";
import { cn } from "@/lib/utils";

interface NotifData {
  notifications: Array<{
    id: string;
    title: string;
    description: string;
    type: 'URGENT' | 'WARNING' | 'INFO' | 'SUCCESS';
    time: string;
    actionUrl?: string;
  }>;
  unread: number;
}

interface TopbarProps {
  userRole: UserRole;
  currentView: ViewKey;
  onMenuClick: () => void;
  onRoleChange: (role: UserRole) => void;
  onNavigate?: (view: ViewKey) => void;
  onOpenOrder?: (orderId: string) => void;
  userName?: string;
  orgName?: string;
  onLogout?: () => void;
}

const viewTitles: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Your operations at a glance" },
  unconfirmed: { title: "Unconfirmed Orders", subtitle: "Awaiting customer confirmation via WhatsApp / Call" },
  confirmed: { title: "Confirmed Orders", subtitle: "Ready for courier dispatch" },
  tracking: { title: "In Transit", subtitle: "Live tracking across all couriers" },
  attention: { title: "Needs Attention", subtitle: "AI-triaged exceptions requiring action" },
  returns: { title: "Returns / RTO", subtitle: "Return-to-origin cases with evidence timelines" },
  customers: { title: "Customers", subtitle: "Customer profiles, order history & risk scores" },
  whatsapp: { title: "WhatsApp Inbox", subtitle: "Customer conversations & automation status" },
  couriers: { title: "Courier Integrations", subtitle: "Manage connected courier accounts" },
  automation: { title: "Automation Rules", subtitle: "Event-driven workflows & triggers" },
  analytics: { title: "Analytics", subtitle: "Delivery performance & financial insights" },
  ai: { title: "AI Insights", subtitle: "Risk predictions & recommended actions" },
  settings: { title: "Settings", subtitle: "Organization, store & preference settings" },
  billing: { title: "Billing & Subscription", subtitle: "Plan, usage & invoices" },
  team: { title: "Team Members", subtitle: "Roles, permissions & invitations" },
};

interface MeData {
  user: {
    id: string;
    name: string;
    email: string;
    isSuperAdmin: boolean;
  };
  role: string;
}

export function Topbar({ userRole, currentView, onMenuClick, onRoleChange, onNavigate, onOpenOrder, userName, orgName, onLogout }: TopbarProps) {
  const [roleOpen, setRoleOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: notifData, loading: notifLoading } = useApi<NotifData>("/api/v1/notifications");
  const { data: meData } = useApi<MeData>("/api/v1/auth/me");
  const isSuperAdmin = meData?.user?.isSuperAdmin ?? false;
  const meta = viewTitles[currentView];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight">{meta.title}</h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{meta.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <SearchBox onNavigate={onNavigate || (() => {})} onOpenOrder={onOpenOrder} />

          {/* Store selector */}
          <div className="hidden items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm sm:flex">
            <Store className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{orgName || "Demo Store PK"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative rounded-md p-2 text-muted-foreground hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notifData && notifData.unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                  <div className="border-b border-border bg-muted/30 px-4 py-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">Notifications</p>
                    {notifData && notifData.unread > 0 && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">{notifData.unread} new</span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifLoading ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">Loading...</div>
                    ) : notifData && notifData.notifications.length > 0 ? (
                      notifData.notifications.map((n) => (
                        <div key={n.id} className="flex gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/30">
                          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            n.type === 'URGENT' ? 'bg-red-500' :
                            n.type === 'WARNING' ? 'bg-amber-500' :
                            n.type === 'SUCCESS' ? 'bg-emerald-500' :
                            'bg-sky-500'
                          )} />
                          <div className="min-w-0">
                            <p className="text-sm leading-snug">{n.title}</p>
                            <p className="text-xs text-muted-foreground">{formatTimeAgo(n.time)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications</div>
                    )}
                  </div>
                  <button className="w-full border-t border-border bg-muted/30 py-2 text-center text-xs font-medium text-primary hover:bg-muted/60">
                    View all notifications
                  </button>
                </div>
              </>
            )}
          </div>

          {/* User / Role switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleOpen(!roleOpen)}
              className="flex items-center gap-2 rounded-md border border-border bg-muted/40 py-1.5 pl-1.5 pr-2 hover:bg-muted"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-teal-600 to-emerald-700 text-xs font-bold text-white">
                {(userName || "HS").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden text-left leading-none sm:block">
                <p className="text-xs font-semibold">{userName || "Hamza Sheikh"}</p>
                <p className="text-[10px] text-muted-foreground">{userRoleConfig[userRole].label}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {roleOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setRoleOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold">{userName || "Hamza Sheikh"}</p>
                    <p className="text-xs text-muted-foreground">{orgName || "Demo Store PK"}</p>
                  </div>
                  <div className="border-b border-border px-4 py-2">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Switch role (demo)
                    </p>
                    <div className="space-y-0.5">
                      {(["OWNER", "ADMIN", "MANAGER", "OPERATOR", "VIEWER"] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            onRoleChange(r);
                            setRoleOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-muted",
                            userRole === r && "bg-muted font-medium"
                          )}
                        >
                          <span>{userRoleConfig[r].label}</span>
                          {userRole === r && <span className="text-xs text-primary">Active</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <a href="/admin" className="flex w-full items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                      <ShieldCheck className="h-4 w-4" />
                      Super Admin Panel
                    </a>
                  )}
                  <button onClick={async () => { await fetch('/api/v1/auth/logout', { method: 'POST' }); onLogout?.(); }} className="w-full py-2 text-center text-xs font-medium text-red-600 hover:bg-red-50">
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
