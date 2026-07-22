import type { MessageKey } from "@/shared/i18n/messages/types";

const KEYS: Record<string, MessageKey> = {
  INQUIRY_NOT_FOUND: "support.detail.notFound",
  "INQUIRY-001": "support.detail.privateForbidden",
};

export function inquiryErrorMessage(code: string | undefined): MessageKey {
  if (!code) return "support.detail.loadFailed";
  return KEYS[code] ?? "support.detail.loadFailed";
}
