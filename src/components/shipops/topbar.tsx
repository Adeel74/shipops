"use client";

import { Menu, Search, Bell, ChevronDown, Store } from "lucide-react";
import { useState } from "react";
import type { UserRole, ViewKey } from "@/lib/types";
import { userRoleConfig } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TopbarProps {
  userRole: UserRole;
  currentView: ViewKey;
  onMenuClick: () => void;
  onRoleChange: (role: UserRole) => void;
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

export function Topbar({ userRole, currentView, onMenuClick, onRoleChange }: TopbarProps) {
  const [roleOpen, setRoleOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
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
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders, customers, tracking..."
              className="h-9 w-64 rounded-md border border-input bg-muted/40 pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/20 lg:w-72"
            />
          </div>

          {/* Store selector */}
          <div className="hidden items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm sm:flex">
            <Store className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Demo Store PK</span>
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
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                  <div className="border-b border-border bg-muted/30 px-4 py-3">
                    <p className="text-sm font-semibold">Notifications</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {[
                      { t: "Urgent: Maham Ali refused delivery", time: "19h ago", color: "bg-red-500" },
                      { t: "AI flagged #1045 as HIGH RTO risk (78%)", time: "23m ago", color: "bg-amber-500" },
                      { t: "TCS API: 2 shipments stuck at sort hub", time: "1h ago", color: "bg-orange-500" },
                      { t: "Bilal Ahmed confirmed order #1044", time: "40m ago", color: "bg-emerald-500" },
                    ].map((n, i) => (
                      <div key={i} className="flex gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/30">
                        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.color)} />
                        <div className="min-w-0">
                          <p className="text-sm leading-snug">{n.t}</p>
                          <p className="text-xs text-muted-foreground">{n.time}</p>
                        </div>
                      </div>
                    ))}
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
                HS
              </div>
              <div className="hidden text-left leading-none sm:block">
                <p className="text-xs font-semibold">Hamza Sheikh</p>
                <p className="text-[10px] text-muted-foreground">{userRoleConfig[userRole].label}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {roleOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setRoleOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold">Hamza Sheikh</p>
                    <p className="text-xs text-muted-foreground">hamza@demostore.pk</p>
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
                  <button className="w-full py-2 text-center text-xs font-medium text-red-600 hover:bg-red-50">
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
