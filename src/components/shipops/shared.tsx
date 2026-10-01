"use client";

import { cn } from "@/lib/utils";
import type { OrderStatus, RiskLevel } from "@/lib/types";
import { orderStatusConfig, riskLevelConfig } from "@/lib/format";

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const cfg = orderStatusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cfg.bg,
        cfg.color,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function RiskBadge({ level, score, className }: { level: RiskLevel; score?: number; className?: string }) {
  const cfg = riskLevelConfig[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        cfg.bg,
        className
      )}
    >
      {cfg.label}
      {score !== undefined && <span className="opacity-70">· {score}</span>}
    </span>
  );
}

export function RiskMeter({ score, className }: { score: number; className?: string }) {
  const color = score >= 60 ? "bg-red-500" : score >= 35 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("text-xs font-semibold", score >= 60 ? "text-red-600" : score >= 35 ? "text-amber-600" : "text-emerald-600")}>
        {score}%
      </span>
    </div>
  );
}

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1400px] p-4 lg:p-6", className)}>{children}</div>;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="mb-1 text-sm font-semibold">{title}</p>
      <p className="mb-4 max-w-sm text-xs text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 lg:px-5">
          <div>
            {title && <p className="text-sm font-semibold">{title}</p>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-4 lg:p-5", bodyClassName)}>{children}</div>
    </div>
  );
}

export function CourierTag({ courier, className }: { courier: string; className?: string }) {
  const map: Record<string, { label: string; color: string }> = {
    TCS: { label: "TCS", color: "bg-red-100 text-red-700 border-red-200" },
    LEOPARDS: { label: "Leopards", color: "bg-orange-100 text-orange-700 border-orange-200" },
    "M&P": { label: "M&P", color: "bg-violet-100 text-violet-700 border-violet-200" },
    TRAX: { label: "Trax", color: "bg-teal-100 text-teal-700 border-teal-200" },
    POSTEX: { label: "PostEx", color: "bg-blue-100 text-blue-700 border-blue-200" },
    CALL_COURIER: { label: "Call Courier", color: "bg-sky-100 text-sky-700 border-sky-200" },
    RIDER: { label: "Rider", color: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  };
  const cfg = map[courier] || { label: courier, color: "bg-zinc-100 text-zinc-700 border-zinc-200" };
  return (
    <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold", cfg.color, className)}>
      {cfg.label}
    </span>
  );
}
