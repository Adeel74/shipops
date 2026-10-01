"use client";

import { cn } from "@/lib/utils";

export function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
          Try again
        </button>
      )}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl border border-border bg-card p-4", className)}>
      <div className="mb-2 h-4 w-20 rounded bg-muted" />
      <div className="h-7 w-28 rounded bg-muted" />
    </div>
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-t border-border/60">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-2.5">
          <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-muted" />
        </td>
      ))}
    </tr>
  );
}
