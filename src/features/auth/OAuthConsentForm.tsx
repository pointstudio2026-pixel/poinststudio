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
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { t } = useTranslation();

  const canSubmit = agreedToTerms && name.trim().length > 0 && birthDate.length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setServerError(t("oauthConsent.mustAgree"));
      return;
    }
    if (!canSubmit) return;
    setServerError(null);
    setIsSubmitting(true);
    try {
      const { user } = await completeOAuthSignup({ agreedToTerms, name: name.trim(), birthDate });
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

      {agreedToTerms && (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="oauth-consent-name" className="text-sm font-medium text-ink">
              {t("oauthConsent.nameLabel")}
            </label>
            <input
              id="oauth-consent-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("oauthConsent.namePlaceholder")}
              autoFocus
              className="rounded-full border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-ink"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="oauth-consent-birthdate" className="text-sm font-medium text-ink">
              {t("oauthConsent.birthDateLabel")}
            </label>
            <input
              id="oauth-consent-birthdate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="rounded-full border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-ink"
            />
          </div>
        </div>
      )}

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting || !canSubmit}
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
