"use client";

import { LayoutDashboard, Inbox, CheckCircle2, Truck, AlertTriangle, Undo2, Users, MessageCircle, Package, Zap, BarChart3, Sparkles, Settings, CreditCard, UserCog, Ship } from "lucide-react";
import type { ViewKey, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  badgeColor?: string;
  roles: UserRole[];
  group: "operations" | "engagement" | "intelligence" | "admin";
}

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["OWNER", "ADMIN", "MANAGER", "OPERATOR", "VIEWER"], group: "operations" },
  { key: "unconfirmed", label: "Unconfirmed", icon: Inbox, badge: 4, badgeColor: "bg-amber-500", roles: ["OWNER", "ADMIN", "MANAGER", "OPERATOR"], group: "operations" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2, badge: 3, badgeColor: "bg-sky-500", roles: ["OWNER", "ADMIN", "MANAGER", "OPERATOR"], group: "operations" },
  { key: "tracking", label: "In Transit", icon: Truck, badge: 2, badgeColor: "bg-indigo-500", roles: ["OWNER", "ADMIN", "MANAGER", "OPERATOR"], group: "operations" },
  { key: "attention", label: "Needs Attention", icon: AlertTriangle, badge: 5, badgeColor: "bg-red-500", roles: ["OWNER", "ADMIN", "MANAGER", "OPERATOR"], group: "operations" },
  { key: "returns", label: "Returns / RTO", icon: Undo2, badge: 2, badgeColor: "bg-orange-500", roles: ["OWNER", "ADMIN", "MANAGER", "OPERATOR"], group: "operations" },
  { key: "customers", label: "Customers", icon: Users, roles: ["OWNER", "ADMIN", "MANAGER", "OPERATOR", "VIEWER"], group: "operations" },
  { key: "whatsapp", label: "WhatsApp Inbox", icon: MessageCircle, badge: 4, badgeColor: "bg-emerald-500", roles: ["OWNER", "ADMIN", "MANAGER", "OPERATOR"], group: "engagement" },
  { key: "couriers", label: "Couriers", icon: Package, roles: ["OWNER", "ADMIN", "MANAGER"], group: "engagement" },
  { key: "automation", label: "Automation", icon: Zap, roles: ["OWNER", "ADMIN", "MANAGER"], group: "engagement" },
  { key: "analytics", label: "Analytics", icon: BarChart3, roles: ["OWNER", "ADMIN", "MANAGER", "VIEWER"], group: "intelligence" },
  { key: "ai", label: "AI Insights", icon: Sparkles, roles: ["OWNER", "ADMIN", "MANAGER"], group: "intelligence" },
  { key: "team", label: "Team", icon: UserCog, roles: ["OWNER", "ADMIN"], group: "admin" },
  { key: "billing", label: "Billing", icon: CreditCard, roles: ["OWNER"], group: "admin" },
  { key: "settings", label: "Settings", icon: Settings, roles: ["OWNER", "ADMIN"], group: "admin" },
];

const groupLabels: Record<string, string> = {
  operations: "Operations",
  engagement: "Engagement",
  intelligence: "Intelligence",
  admin: "Administration",
};

interface SidebarProps {
  currentView: ViewKey;
  onViewChange: (view: ViewKey) => void;
  userRole: UserRole;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ currentView, onViewChange, userRole, open, onClose }: SidebarProps) {
  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));
  const groups = ["operations", "engagement", "intelligence", "admin"] as const;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 border-b border-[var(--sidebar-border)] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]">
            <Ship className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">ShipOps</span>
            <span className="text-[10px] text-[var(--sidebar-foreground)]/60">COD Operations Cloud</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((group) => {
            const items = visibleItems.filter((i) => i.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="mb-5">
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--sidebar-foreground)]/40">
                  {groupLabels[group]}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = currentView === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          onViewChange(item.key);
                          onClose();
                        }}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]"
                            : "text-[var(--sidebar-foreground)]/70 hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", active ? "" : "text-[var(--sidebar-foreground)]/50 group-hover:text-[var(--sidebar-accent-foreground)]")} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge ? (
                          <span
                            className={cn(
                              "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white",
                              active ? "bg-white/25" : item.badgeColor
                            )}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Plan card */}
        <div className="border-t border-[var(--sidebar-border)] p-3">
          <div className="rounded-lg bg-[var(--sidebar-accent)] p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--sidebar-accent-foreground)]">Growth Plan</span>
              <span className="rounded-full bg-[var(--sidebar-primary)] px-2 py-0.5 text-[10px] font-bold text-[var(--sidebar-primary-foreground)]">ACTIVE</span>
            </div>
            <p className="mb-2 text-[11px] text-[var(--sidebar-foreground)]/60">1,842 / 3,000 orders this month</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--sidebar-border)]">
              <div className="h-full rounded-full bg-[var(--sidebar-primary)]" style={{ width: "61%" }} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
