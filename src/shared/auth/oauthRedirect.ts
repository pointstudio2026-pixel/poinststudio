/**
 * `redirect`/`next`-style query params are a classic open-redirect vector --
 * only allow a same-origin relative path ("/projects"), never a full URL or
 * protocol-relative path ("//evil.com", "https://evil.com") that a browser
 * would treat as leaving the site.
 */
export function safeRelativeRedirect(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("://")) return null;
  return value;
}
