"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completeOAuthSignup } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";
import { Spinner } from "@/components/Spinner";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

export function OAuthConsentForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { t } = useTranslation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setServerError(t("oauthConsent.mustAgree"));
      return;
    }
    setServerError(null);
    setIsSubmitting(true);
    try {
      const { user } = await completeOAuthSignup({ agreedToTerms });
      setUser(user);
      router.push("/projects");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t("oauthConsent.genericError"));
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
          />
          <span>
            <Link href="/terms" target="_blank" className="underline underline-offset-4">
              {t("authTermsCheckbox.terms")}
            </Link>{" "}
            {t("authTermsCheckbox.middle")}{" "}
            <Link href="/privacy" target="_blank" className="underline underline-offset-4">
              {t("authTermsCheckbox.privacy")}
            </Link>
            {t("authTermsCheckbox.suffix")}
          </span>
        </label>
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm text-paper transition hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting && <Spinner />}
        {isSubmitting ? t("oauthConsent.submitting") : t("oauthConsent.submit")}
      </button>

      <Link href="/login" className="text-center text-xs text-muted underline underline-offset-4">
        {t("oauthConsent.cancel")}
      </Link>
    </form>
  );
}
