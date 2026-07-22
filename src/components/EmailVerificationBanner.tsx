"use client";

import { useState } from "react";
import { resendVerificationEmail } from "@/services/auth-service";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

export function EmailVerificationBanner({ emailVerified }: { emailVerified: boolean }) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  if (emailVerified) return null;

  async function handleResend() {
    setIsSending(true);
    setError(null);
    try {
      await resendVerificationEmail();
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.emailVerification.resendFailed"));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-8 py-2.5 text-sm text-amber-900">
      <span>
        {t("dashboard.emailVerification.message")}
        {sent && ` ${t("dashboard.emailVerification.resent")}`}
        {error && ` (${error})`}
      </span>
      <button
        type="button"
        onClick={handleResend}
        disabled={isSending || sent}
        className="rounded-full border border-amber-300 px-3 py-1 text-xs transition hover:border-amber-500 disabled:opacity-50"
      >
        {isSending ? t("dashboard.emailVerification.sending") : sent ? t("dashboard.emailVerification.sent") : t("dashboard.emailVerification.resend")}
      </button>
    </div>
  );
}
