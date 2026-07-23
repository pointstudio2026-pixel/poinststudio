"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

export function OAuthButtons({ intent }: { intent: "login" | "register" }) {
  const { t } = useTranslation();
  // 카카오 로그인은 정식 출시 전까지 비활성화 -- 실제 OAuth로 이동하지
  // 않고 안내 문구만 보여준다 (결제 수단 모달의 "정식 서비스 출시 이후"
  // 패턴과 동일).
  const [kakaoNotReady, setKakaoNotReady] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        {t("authOauth.or")}
        <span className="h-px flex-1 bg-line" />
      </div>

      {intent === "login" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
          {t("authOauth.loginNotice")}
        </p>
      )}

      <a
        href={`/api/auth/oauth/google/start?intent=${intent}`}
        className="flex items-center justify-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-medium transition hover:border-ink"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.617z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
          <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
        </svg>
        {t("authOauth.google")}
      </a>

      <button
        type="button"
        onClick={() => setKakaoNotReady(true)}
        className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[#191919] transition hover:opacity-90"
        style={{ backgroundColor: "#FEE500" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <path d="M8 1.5C4.13 1.5 1 3.98 1 7.03c0 1.94 1.28 3.65 3.22 4.63-.14.5-.5 1.83-.58 2.12-.1.36.13.36.28.26.11-.08 1.79-1.21 2.52-1.71.5.07 1.03.11 1.56.11 3.87 0 7-2.48 7-5.53S11.87 1.5 8 1.5Z" />
        </svg>
        {t("authOauth.kakao")}
      </button>

      {kakaoNotReady && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
          {t("authOauth.kakaoNotReady")}
        </p>
      )}

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
