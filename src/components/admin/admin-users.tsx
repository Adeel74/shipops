"use client";

import { useState, useMemo } from "react";
import { Search, ShieldCheck, Ban, CheckCircle2, Trash2, Crown, Building2, MoreVertical, X } from "lucide-react";
import { useApi, apiPatch } from "@/hooks/use-api";
import { LoadingScreen } from "@/components/shipops/loading";
import { formatTimeAgo, userRoleConfig } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  status: string;
  createdAt: string;
  memberships: Array<{ role: string; organization: { id: string; name: string; slug: string } }>;
  activeSessions: number;
}

const roleOptions = ['OWNER', 'ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER'];

export function AdminUsers() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const { data, loading, refetch } = useApi<{ users: AdminUser[]; total: number }>(
    `/api/v1/admin/users${search ? `?q=${encodeURIComponent(search)}` : ""}`
  );
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [roleModal, setRoleModal] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");

  const users = data?.users || [];

  const handleAction = async (user: AdminUser, action: string) => {
    setActionMenu(null);
    const res = await apiPatch(`/api/v1/admin/users/${user.id}`, { action });
    if (res.success) {
      toast({ title: res.data?.message || `User ${action}ed`, description: `${user.name} · ${user.email}` });
      refetch();
    } else {
      toast({ title: "Failed", description: res.error, variant: "destructive" });
    }
  };

  const handleToggleSuperAdmin = async (user: AdminUser) => {
    setActionMenu(null);
    const res = await apiPatch(`/api/v1/admin/users/${user.id}`, { isSuperAdmin: !user.isSuperAdmin });
    if (res.success) {
      toast({ title: res.data?.message, description: user.email });
      refetch();
    } else {
      toast({ title: "Failed", description: res.error, variant: "destructive" });
    }
  };

  const handleDelete = async (user: AdminUser) => {
    setActionMenu(null);
    if (!confirm(`Permanently delete user "${user.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/v1/admin/users/${user.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      toast({ title: "User deleted", description: user.email });
      refetch();
    } else {
      toast({ title: "Failed", description: json.error?.message, variant: "destructive" });
    }
  };

  const handleRoleChange = async () => {
    if (!roleModal || !selectedOrgId || !selectedRole) return;
    const res = await apiPatch(`/api/v1/admin/users/${roleModal.id}`, { role: selectedRole, organizationId: selectedOrgId });
    if (res.success) {
      toast({ title: res.data?.message, description: roleModal.email });
      setRoleModal(null);
      refetch();
    } else {
      toast({ title: "Failed", description: res.error, variant: "destructive" });
    }
  };

  if (loading || !data) return <LoadingScreen message="Loading users..." />;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 lg:p-6">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name or email..."
          className="h-10 w-full max-w-md rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Users', value: data.total, color: 'text-sky-600' },
          { label: 'Super Admins', value: users.filter((u) => u.isSuperAdmin).length, color: 'text-red-600' },
          { label: 'Suspended', value: users.filter((u) => u.status === 'SUSPENDED').length, color: 'text-amber-600' },
          { label: 'Active Now', value: users.filter((u) => u.activeSessions > 0).length, color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3">
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">Organizations</th>
                <th className="hidden px-4 py-2.5 text-center font-medium md:table-cell">Status</th>
                <th className="hidden px-4 py-2.5 text-center font-medium lg:table-cell">Sessions</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={cn(
                  "border-t border-border/60 hover:bg-muted/20",
                  u.status === 'SUSPENDED' && "opacity-60 bg-red-50/30"
                )}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white",
                        u.isSuperAdmin ? "bg-gradient-to-br from-rose-500 to-red-700" : "bg-gradient-to-br from-teal-500 to-emerald-600"
                      )}>
                        {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{u.name}</p>
                        {u.isSuperAdmin && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            SUPER ADMIN
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{u.email}</td>
                  <td className="hidden px-4 py-2.5 md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {u.memberships.map((m, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded border border-border bg-muted/30 px-1.5 py-0.5 text-[10px]">
                          <Building2 className="h-2.5 w-2.5 text-muted-foreground" />
                          {m.organization.name}
                          <span className={cn("rounded px-1 text-[8px] font-bold", userRoleConfig[m.role]?.color || "bg-zinc-100 text-zinc-600")}>
                            {m.role}
                          </span>
                        </span>
                      ))}
                      {u.memberships.length === 0 && <span className="text-xs text-muted-foreground">No org</span>}
                    </div>
                  </td>
                  <td className="hidden px-4 py-2.5 text-center md:table-cell">
                    {u.status === 'SUSPENDED' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        <Ban className="h-2.5 w-2.5" />
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-2.5 text-center lg:table-cell">
                    {u.activeSessions > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {u.activeSessions} active
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Offline</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)}
                        className="rounded-md p-1.5 hover:bg-muted"
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {actionMenu === u.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />
                          <div className="absolute right-0 top-9 z-50 w-56 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                            <button
                              onClick={() => handleToggleSuperAdmin(u)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
                            >
                              <Crown className="h-3.5 w-3.5 text-amber-500" />
                              {u.isSuperAdmin ? 'Remove Super Admin' : 'Promote to Super Admin'}
                            </button>
                            {u.memberships.length > 0 && (
                              <button
                                onClick={() => {
                                  setRoleModal(u);
                                  setSelectedOrgId(u.memberships[0].organization.id);
                                  setSelectedRole(u.memberships[0].role);
                                  setActionMenu(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
                              >
                                <Building2 className="h-3.5 w-3.5 text-sky-500" />
                                Change Role
                              </button>
                            )}
                            {u.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleAction(u, 'suspend')}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-amber-600 hover:bg-amber-50"
                              >
                                <Ban className="h-3.5 w-3.5" />
                                Suspend User
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(u, 'activate')}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-emerald-600 hover:bg-emerald-50"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Activate User
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(u)}
                              className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete User
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role change modal */}
      {roleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRoleModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Change Role — {roleModal.name}</h3>
              <button onClick={() => setRoleModal(null)} className="rounded p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Organization</label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring"
                >
                  {roleModal.memberships.map((m, i) => (
                    <option key={i} value={m.organization.id}>{m.organization.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">New Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleRoleChange}
                className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
