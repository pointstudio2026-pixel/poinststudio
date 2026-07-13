export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Ensures concurrent 401s only trigger a single POST /api/auth/refresh call
// ("동시 Refresh 요청" from Task-004) instead of one per failed request.
let inFlightRefresh: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!inFlightRefresh) {
    inFlightRefresh = fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        inFlightRefresh = null;
      });
  }
  return inFlightRefresh;
}

/**
 * Shared fetch wrapper for all `services/*`. On a 401 it performs a single
 * silent refresh and retries once; if the refresh also fails it redirects
 * to /login (Task-004: Silent Refresh / 인증 만료 처리).
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  isRetry = false,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch<T>(path, init, true);
    }
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!body || !body.success || !body.data) {
    throw new ApiError(
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ?? "요청을 처리하지 못했습니다.",
    );
  }
  return body.data;
}
