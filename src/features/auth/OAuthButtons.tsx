"use client";

import Link from "next/link";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

export function OAuthButtons({ intent }: { intent: "login" | "register" }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        {t("authOauth.or")}
        <span className="h-px flex-1 bg-line" />
      </div>

      <a
        href={`/api/auth/oauth/google/start?intent=${intent}`}
        className="flex items-center justify-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-medium transition hover:border-ink"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line text-[11px] font-bold">
          G
        </span>
        {t("authOauth.google")}
      </a>

      <a
        href={`/api/auth/oauth/kakao/start?intent=${intent}`}
        className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[#191919] transition hover:opacity-90"
        style={{ backgroundColor: "#FEE500" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <path d="M8 1.5C4.13 1.5 1 3.98 1 7.03c0 1.94 1.28 3.65 3.22 4.63-.14.5-.5 1.83-.58 2.12-.1.36.13.36.28.26.11-.08 1.79-1.21 2.52-1.71.5.07 1.03.11 1.56.11 3.87 0 7-2.48 7-5.53S11.87 1.5 8 1.5Z" />
        </svg>
        {t("authOauth.kakao")}
      </a>

      <p className="text-center text-xs text-muted">
        {t("authOauth.consentPrefix")}{" "}
        <Link href="/terms" target="_blank" className="underline underline-offset-4">
          {t("authOauth.terms")}
        </Link>{" "}
        {t("authOauth.consentMiddle")}{" "}
        <Link href="/privacy" target="_blank" className="underline underline-offset-4">
          {t("authOauth.privacy")}
        </Link>
        {t("authOauth.consentSuffix")}
      </p>
    </div>
  );
}
