"use client";

import { UserPlus, MoreHorizontal, Mail, Clock, Shield, Crown, Pencil, Trash2 } from "lucide-react";
import { userRoleConfig, formatTimeAgo } from "@/lib/format";
import { PageContainer, SectionCard } from "../shared";
import { LoadingScreen } from "../loading";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { UserRole, TeamMember } from "@/lib/types";

const rolePermissions: Record<UserRole, string[]> = {
  OWNER: ["Everything", "Billing", "Team management", "Ownership transfer"],
  ADMIN: ["Dashboard", "Orders", "Customers", "Shipments", "WhatsApp", "Automation", "Analytics", "Settings", "Team"],
  MANAGER: ["Dashboard", "Orders", "Customers", "Shipments", "WhatsApp", "Analytics"],
  OPERATOR: ["Dashboard", "Orders", "Customers", "Shipments", "WhatsApp"],
  VIEWER: ["Dashboard", "Orders", "Customers", "Analytics (read-only)"],
};

export function TeamView() {
  const { toast } = useToast();
  const { data, loading } = useApi<{ members: TeamMember[] }>("/api/v1/team");

  if (loading || !data) return <PageContainer><LoadingScreen message="Loading team members..." /></PageContainer>;

  const teamMembers = data.members;

  return (
    <PageContainer className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Members", value: teamMembers.length, color: "text-zinc-600" },
          { label: "Active", value: teamMembers.filter((m) => m.status === "ACTIVE").length, color: "text-emerald-600" },
          { label: "Invited", value: teamMembers.filter((m) => m.status === "INVITED").length, color: "text-amber-600" },
          { label: "Seats Used", value: "5 / 5", color: "text-violet-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Members */}
      <SectionCard
        title="Team Members"
        description="Manage roles, permissions & invitations"
        action={
          <button
            onClick={() => toast({ title: "Invite team member", description: "Email invitation will be sent" })}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite Member
          </button>
        }
        bodyClassName="p-0"
      >
        <div className="divide-y divide-border">
          {teamMembers.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3 p-4 lg:p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: m.avatarColor }}>
                {m.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{m.name}</p>
                  {m.role === "OWNER" && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                  <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold", userRoleConfig[m.role].color)}>
                    {userRoleConfig[m.role].label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{m.email}</p>
                {m.status === "ACTIVE" && m.lastActiveAt && (
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    Last active {formatTimeAgo(m.lastActiveAt)}
                  </p>
                )}
                {m.status === "INVITED" && (
                  <p className="flex items-center gap-1 text-[11px] text-amber-600">
                    <Mail className="h-2.5 w-2.5" />
                    Invitation sent — pending acceptance
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {m.status === "INVITED" && (
                  <button
                    onClick={() => toast({ title: "Invitation resent", description: m.email })}
                    className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-muted"
                  >
                    Resend
                  </button>
                )}
                {m.role !== "OWNER" && (
                  <>
                    <button onClick={() => toast({ title: "Edit role", description: m.name })} className="rounded p-1.5 hover:bg-muted">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => toast({ title: "Remove member?", description: m.name })} className="rounded p-1.5 hover:bg-muted">
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Roles & permissions */}
      <SectionCard title="Roles & Permissions" description="What each role can access in ShipOps">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(rolePermissions) as UserRole[]).map((role) => (
            <div key={role} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                {role === "OWNER" && <Crown className="h-4 w-4 text-amber-500" />}
                {role === "ADMIN" && <Shield className="h-4 w-4 text-sky-500" />}
                {role === "MANAGER" && <Shield className="h-4 w-4 text-violet-500" />}
                {role === "OPERATOR" && <Shield className="h-4 w-4 text-amber-500" />}
                {role === "VIEWER" && <Shield className="h-4 w-4 text-zinc-400" />}
                <span className={cn("rounded border px-2 py-0.5 text-xs font-semibold", userRoleConfig[role].color)}>
                  {userRoleConfig[role].label}
                </span>
              </div>
              <ul className="space-y-1">
                {rolePermissions[role].map((p) => (
                  <li key={p} className="text-xs text-muted-foreground">• {p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-start gap-2 text-xs text-amber-800">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span><strong>Security:</strong> Frontend navigation is hidden based on role, but all backend APIs enforce RBAC independently. A viewer cannot mutate data even by calling APIs directly.</span>
          </p>
        </div>
      </SectionCard>

      {/* Invitation link (dev) */}
      <SectionCard title="Development Invitation" description="In production, invitations are sent via email. In dev, the link is shown in server logs.">
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Sample invitation URL (expires in 7 days):</p>
          <code className="block truncate font-mono text-xs">https://app.shipops.pk/invite/accept?token=inv_8a3b9f2c4e1d7a6b5c8d...</code>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
