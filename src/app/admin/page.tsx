"use client";

import { useState, useEffect } from "react";
import { AdminShell, type AdminView } from "@/components/admin/admin-shell";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminOrganizations } from "@/components/admin/admin-organizations";
import { AdminUsers } from "@/components/admin/admin-users";
import { AdminOrders } from "@/components/admin/admin-orders";
import { AdminPlans } from "@/components/admin/admin-plans";
import { AdminActivity } from "@/components/admin/admin-activity";
import { AdminWebhooks } from "@/components/admin/admin-webhooks";
import { AdminSystem } from "@/components/admin/admin-system";
import { ShieldCheck, Lock } from "lucide-react";

export default function AdminPage() {
  const [view, setView] = useState<AdminView>("dashboard");
  const [access, setAccess] = useState<'loading' | 'granted' | 'denied'>('loading');

  // Check super admin access on mount
  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.user?.isSuperAdmin) {
          setAccess('granted');
        } else {
          setAccess('denied');
        }
      })
      .catch(() => setAccess('denied'));
  }, []);

  if (access === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verifying super admin access...</p>
        </div>
      </div>
    );
  }

  if (access === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-700">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-white">Access Denied</h1>
          <p className="mb-6 text-sm text-zinc-400">
            You don&apos;t have super admin privileges. This area is restricted to platform administrators only.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
          >
            <ShieldCheck className="h-4 w-4" />
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <AdminShell currentView={view} onViewChange={setView} onExit={() => window.location.href = '/'}>
      {view === 'dashboard' && <AdminDashboard />}
      {view === 'organizations' && <AdminOrganizations />}
      {view === 'users' && <AdminUsers />}
      {view === 'orders' && <AdminOrders />}
      {view === 'plans' && <AdminPlans />}
      {view === 'activity' && <AdminActivity />}
      {view === 'webhooks' && <AdminWebhooks />}
      {view === 'system' && <AdminSystem />}
    </AdminShell>
  );
}
