"use client";

import Link from "next/link";
import { OAuthConsentForm } from "@/features/auth/OAuthConsentForm";
import { LanguageSwitcher } from "@/features/navigation/LanguageSwitcher";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

export function OAuthConsentView({ email, providerLabel }: { email: string; providerLabel: string }) {
  const { t } = useTranslation();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-paper p-8">
      <div className="absolute right-6 top-6">
        <LanguageSwitcher />
      </div>
      <Link href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/aster-mark.png" alt="ASTER" className="h-9 w-auto" />
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8">
        <p className="eyebrow text-sm text-muted">{t("oauthConsent.almostThere")}</p>
        <h1 className="mt-1 text-xl font-semibold">{t("oauthConsent.title")}</h1>
        <p className="mt-3 text-sm text-muted">
          {t("oauthConsent.description", { provider: providerLabel, email })}
        </p>
        <div className="mt-6">
          <OAuthConsentForm />
        </div>
      </div>
    </main>
  );
}
