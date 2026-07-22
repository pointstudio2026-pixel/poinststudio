"use client";

import Link from "next/link";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-line bg-surface px-5 py-14 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-lg font-semibold tracking-tight">ASTER.</span>
          <p className="max-w-xs text-sm text-muted">{t("home.footer.tagline")}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">{t("home.footer.serviceHeading")}</p>
            <a href="#how-it-works" className="text-sm text-muted transition hover:text-ink">
              {t("home.footer.serviceIntro")}
            </a>
            <a href="#pricing" className="text-sm text-muted transition hover:text-ink">
              {t("home.footer.pricing")}
            </a>
            <a href="#faq" className="text-sm text-muted transition hover:text-ink">
              {t("home.footer.faq")}
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">{t("home.footer.legalHeading")}</p>
            <Link href="/terms" className="text-sm text-muted transition hover:text-ink">
              {t("home.footer.terms")}
            </Link>
            <Link href="/privacy" className="text-sm text-muted transition hover:text-ink">
              {t("home.footer.privacy")}
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">{t("home.footer.contactHeading")}</p>
            <Link href="/support" className="text-sm text-muted transition hover:text-ink">
              {t("home.footer.contact")}
            </Link>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-12 max-w-6xl text-xs text-muted">
        {t("home.footer.copyright", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
