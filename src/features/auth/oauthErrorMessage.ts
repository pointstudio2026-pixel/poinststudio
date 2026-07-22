import type { MessageKey } from "@/shared/i18n/messages/types";

const KEYS: Record<string, MessageKey> = {
  not_configured: "oauthError.notConfigured",
  invalid_request: "oauthError.invalidRequest",
  failed: "oauthError.failed",
  no_account: "oauthError.noAccount",
};

export function oauthErrorMessage(code: string | undefined): MessageKey | null {
  if (!code) return null;
  return KEYS[code] ?? "oauthError.fallback";
}
