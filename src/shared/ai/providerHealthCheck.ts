const DEFAULT_TIMEOUT_MS = 8000;

/**
 * GET-only, non-billable reachability check (a model-metadata lookup, never
 * generate/complete). Provider health() implementations must never call
 * their own generate/complete method for a health ping -- that used to
 * trigger a real, paid OpenAI image generation (10-60s, real cost) on every
 * admin dashboard load, which is both a cost leak and the reason the
 * dashboard page hung indefinitely.
 */
export async function isHealthEndpointReachable(
  url: string,
  headers: Record<string, string>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
