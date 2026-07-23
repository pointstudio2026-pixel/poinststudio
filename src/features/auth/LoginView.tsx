"use client";

import Link from "next/link";
import { LoginForm } from "@/features/auth/LoginForm";
import { OAuthButtons } from "@/features/auth/OAuthButtons";
import { oauthErrorMessage } from "@/features/auth/oauthErrorMessage";
import { LanguageSwitcher } from "@/features/navigation/LanguageSwitcher";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

export function LoginView({ oauthErrorCode }: { oauthErrorCode?: string }) {
  const { t } = useTranslation();
  const errorKey = oauthErrorMessage(oauthErrorCode);

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
        <p className="eyebrow text-sm text-muted">{t("login.welcomeBack")}</p>
        <h1 className="mt-1 text-xl font-semibold">{t("login.title")}</h1>
        {errorKey && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {t(errorKey)}
          </p>
        )}
        <div className="mt-6">
          <LoginForm />
        </div>
        <div className="mt-6">
          <OAuthButtons intent="login" />
        </div>
      </div>
      <p className="text-sm text-muted">
        {t("login.noAccount")}{" "}
        <Link href="/register" className="text-ink underline underline-offset-4">
          {t("login.register")}
        </Link>
      </p>
    </main>
  );
}
