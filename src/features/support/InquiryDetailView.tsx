"use client";

import Link from "next/link";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import { INTL_LOCALE } from "@/shared/i18n/locale";
import { inquiryErrorMessage } from "@/features/support/inquiryErrorMessage";

interface InquiryDetailDto {
  subject: string;
  message: string;
  isPublic: boolean;
  createdAt: string;
}

export function InquiryDetailView({
  inquiry,
  errorCode,
}: {
  inquiry: InquiryDetailDto | null;
  errorCode: string | undefined;
}) {
  const { t, locale } = useTranslation();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("support.title")}</h1>
        <Link href="/support" className="text-sm underline">
          {t("support.detail.backToList")}
        </Link>
      </div>

      {inquiry ? (
        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                inquiry.isPublic ? "bg-neutral-100 text-neutral-600" : "bg-amber-50 text-amber-700"
              }`}
            >
              {inquiry.isPublic ? t("support.detail.public") : t("support.detail.private")}
            </span>
            <span className="text-xs text-neutral-400">
              {new Date(inquiry.createdAt).toLocaleString(INTL_LOCALE[locale])}
            </span>
          </div>
          <h2 className="text-lg font-medium">{inquiry.subject}</h2>
          <p className="whitespace-pre-wrap text-sm text-neutral-700">{inquiry.message}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 p-6 text-center text-sm text-neutral-500">
          {t(inquiryErrorMessage(errorCode))}
        </div>
      )}
    </main>
  );
}
