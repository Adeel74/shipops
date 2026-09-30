"use client";

import { useState } from "react";
import { Search, ShieldCheck, Crown, Building2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { LoadingScreen } from "@/components/shipops/loading";
import { formatTimeAgo, userRoleConfig } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  createdAt: string;
  memberships: Array<{ role: string; organization: { id: string; name: string; slug: string } }>;
  activeSessions: number;
}

export function AdminUsers() {
  const [search, setSearch] = useState("");
  const { data, loading } = useApi<{ users: AdminUser[]; total: number }>(
    `/api/v1/admin/users${search ? `?q=${encodeURIComponent(search)}` : ""}`
  );
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

      <p className="text-sm text-muted-foreground">{data.total} users on the platform</p>

      {/* Users table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Organizations</th>
                <th className="hidden px-4 py-2.5 text-center font-medium md:table-cell">Sessions</th>
                <th className="px-4 py-2.5 text-right font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className="border-t border-border/60 hover:bg-muted/20">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white",
                        u.isSuperAdmin ? "bg-gradient-to-br from-rose-500 to-red-700" : "bg-gradient-to-br from-teal-500 to-emerald-600"
                      )}>
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
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
                  <td className="hidden px-4 py-2.5 sm:table-cell">
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
                    {u.activeSessions > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {u.activeSessions} active
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Offline</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{formatTimeAgo(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
