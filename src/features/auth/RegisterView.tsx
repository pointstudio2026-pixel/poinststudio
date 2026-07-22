"use client";

import Link from "next/link";
import { RegisterForm } from "@/features/auth/RegisterForm";
import { OAuthButtons } from "@/features/auth/OAuthButtons";
import { LanguageSwitcher } from "@/features/navigation/LanguageSwitcher";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

export function RegisterView() {
  const { t } = useTranslation();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-paper p-8">
      <div className="absolute right-6 top-6">
        <LanguageSwitcher />
      </div>
      <Link href="/" className="text-lg font-semibold tracking-tight">
        ASTER.
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8">
        <p className="eyebrow text-sm text-muted">{t("register.getStarted")}</p>
        <h1 className="mt-1 text-xl font-semibold">{t("register.title")}</h1>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <div className="mt-6">
          <OAuthButtons intent="register" />
        </div>
      </div>
      <p className="text-sm text-muted">
        {t("register.haveAccount")}{" "}
        <Link href="/login" className="text-ink underline underline-offset-4">
          {t("register.login")}
        </Link>
      </p>
    </main>
  );
}
