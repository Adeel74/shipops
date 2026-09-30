"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseApiOptions {
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  refreshInterval?: number;
}

/**
 * Hook for fetching data from the ShipOps API.
 * Returns { data, loading, error, refetch }.
 * Supports optional polling via refreshInterval.
 */
export function useApi<T>(url: string | null, options?: UseApiOptions & RequestInit): UseApiState<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: !!url,
    error: null,
  });
  const [nonce, setNonce] = useState(0);
  const lastUrl = useRef<string | null>(null);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!url) return;

    // Only set loading=true if this is a new URL or manual refetch
    if (lastUrl.current !== url || nonce > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState((s) => ({ ...s, loading: true, error: null }));
    }
    lastUrl.current = url;

    let cancelled = false;

    fetch(url, options)
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!json.success) {
          setState({ data: null, loading: false, error: json.error?.message || "Request failed" });
        } else {
          setState({ data: json.data, loading: false, error: null });
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setState({ data: null, loading: false, error: e.message || "Network error" });
      });

    return () => {
      cancelled = true;
    };
  }, [url, nonce]);

  // Auto-refresh polling
  useEffect(() => {
    if (!url || !options?.refreshInterval) return;
    const interval = setInterval(() => {
      setNonce((n) => n + 1);
    }, options.refreshInterval);
    return () => clearInterval(interval);
  }, [url, options?.refreshInterval]);

  return { ...state, refetch };
}

/**
 * POST helper for mutations.
 */
export async function apiPost<T>(url: string, body?: unknown): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    return json;
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * PATCH helper for mutations.
 */
export async function apiPatch<T>(url: string, body?: unknown): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    return json;
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
