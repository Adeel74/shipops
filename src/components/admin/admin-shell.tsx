"use client";

import { useState } from "react";
import { Ship, ShieldCheck, LayoutDashboard, Building2, Users, Package, Activity, LogOut, ExternalLink, Menu, X, CreditCard, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminView = "dashboard" | "organizations" | "users" | "orders" | "plans" | "activity" | "system";

interface AdminShellProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
  onExit: () => void;
  children: React.ReactNode;
}

const navItems: { key: AdminView; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "organizations", label: "Organizations", icon: Building2 },
  { key: "users", label: "Users", icon: Users },
  { key: "orders", label: "Orders", icon: Package },
  { key: "plans", label: "Plans & Pricing", icon: CreditCard },
  { key: "activity", label: "Activity Log", icon: ScrollText },
  { key: "system", label: "System", icon: Activity },
];

export function AdminShell({ currentView, onViewChange, onExit, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-zinc-900 text-zinc-100 transition-transform lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 border-b border-zinc-800 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-red-700">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight">ShipOps Admin</span>
            <span className="text-[10px] text-zinc-400">Platform Control Panel</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto rounded p-1 text-zinc-400 hover:bg-zinc-800 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Platform</p>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => { onViewChange(item.key); setSidebarOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-3 space-y-1">
          <button
            onClick={onExit}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ExternalLink className="h-4 w-4" />
            Back to App
          </button>
          <button
            onClick={onExit}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950/30"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-md p-2 hover:bg-muted lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold capitalize">{currentView}</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">Super Admin · Platform-wide view</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
              <ShieldCheck className="h-3 w-3" />
              SUPER ADMIN
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-700 text-xs font-bold text-white">
              HS
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
