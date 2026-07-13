"use client";

import { useEffect } from "react";
import { fetchCurrentUser } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Mounted once in the root layout. On every full page load it asks
 * GET /api/auth/me whether there is a valid session (Task-004: Session
 * Restore). If the access token has expired, `apiFetch`'s silent-refresh
 * retry transparently renews it before this resolves.
 */
export function SessionBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    let cancelled = false;
    setLoading();

    fetchCurrentUser()
      .then(({ user }) => {
        if (!cancelled) setUser(user);
      })
      .catch(() => {
        if (!cancelled) clear();
      });

    return () => {
      cancelled = true;
    };
  }, [setUser, setLoading, clear]);

  return null;
}
