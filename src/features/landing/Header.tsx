"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NewProjectButton } from "@/features/projects/NewProjectButton";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { PrimaryNav, resolveNavGate } from "@/features/navigation/PrimaryNav";
import { LanguageSwitcher } from "@/features/navigation/LanguageSwitcher";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { guideDetailHref, guidesHubHref, guidesHubHrefForCategory } from "@/features/landingArticles/routing";

const NAV_LINKS: { href: string; labelKey: MessageKey }[] = [
  { href: "#top", labelKey: "home.header.navService" },
  { href: "#how-it-works", labelKey: "home.header.navHowItWorks" },
  { href: "#preview", labelKey: "home.header.navPreview" },
  { href: "#pricing", labelKey: "home.header.navPricing" },
  { href: "#faq", labelKey: "home.header.navFaq" },
];

export interface HeaderUser {
  email: string;
  name: string | null;
}

export function Header({ user, planCode }: { user: HeaderUser | null; planCode: PlanCode | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGateOpen, setMobileGateOpen] = useState<string | null>(null);
  const { t, locale } = useTranslation();

  function mobileGateLink(key: "myProjects" | "newProject" | "mockup" | "myStyles" | "team", label: string, href: string) {
    const gate = resolveNavGate(key, user, planCode, t);
    if (!gate) {
      return (
        <Link
          key={key}
          href={href}
          onClick={() => setMobileOpen(false)}
          className="rounded-full border border-line px-4 py-3 text-center text-sm"
        >
          {label}
        </Link>
      );
    }
    return (
      <div key={key} className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setMobileGateOpen(mobileGateOpen === key ? null : key)}
          className="rounded-full border border-line px-4 py-3 text-center text-sm"
        >
          {label}
        </button>
        {mobileGateOpen === key && (
          <div className="rounded-xl bg-surface px-4 py-3 text-center">
            <p className="text-xs text-muted">{gate.message}</p>
            <Link
              href={gate.ctaHref}
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-block rounded-full bg-ink px-4 py-1.5 text-xs text-paper transition hover:opacity-90"
            >
              {gate.ctaLabel}
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="shrink-0">
          <Image
            src="/brand/aster-full.png"
            alt="ASTER"
            width={1390}
            height={424}
            sizes="110px"
            priority
            className="h-7 w-auto sm:h-8"
          />
        </Link>

        <nav className="hidden items-center gap-4 text-xs text-muted lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap border-b border-transparent pb-0.5 transition hover:border-[var(--color-gold)] hover:text-ink"
            >
              {t(link.labelKey)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <PrimaryNav user={user} planCode={planCode} />
        </div>

        {!user && (
          <div className="lg:hidden">
            <LanguageSwitcher />
          </div>
        )}

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line lg:hidden"
          aria-label={t("home.header.menuOpen")}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M1 1l16 16M17 1L1 17" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M0 1h18M0 7h18M0 13h18" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-line bg-paper px-5 py-5 lg:hidden">
          <nav className="flex flex-col gap-1 text-base">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-2 py-3 transition hover:bg-surface"
              >
                {t(link.labelKey)}
              </a>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
            <div className="flex justify-center pb-1">
              <LanguageSwitcher />
            </div>

            {mobileGateLink("myProjects", t("nav.myProjects"), "/projects")}
            {resolveNavGate("newProject", user, planCode, t) ? (
              mobileGateLink("newProject", t("dashboard.newProject.button"), "/login")
            ) : (
              <div className="[&>button]:w-full [&>button]:justify-center [&>button]:py-3">
                <NewProjectButton />
              </div>
            )}
            {mobileGateLink("mockup", t("nav.mockup"), "/mockups/new")}
            {mobileGateLink("myStyles", t("nav.myStyles"), "/my-styles")}
            {mobileGateLink("team", t("nav.team"), "/team")}

            <Link href="/guide" className="rounded-full border border-line px-4 py-3 text-center text-sm">
              {t("nav.guide")}
            </Link>
            <Link
              href={guidesHubHref(locale)}
              className="rounded-full border border-line px-4 py-3 text-center text-sm"
            >
              {t("nav.useCases")}
            </Link>
            <Link
              href={guideDetailHref(locale, "why-aster")}
              className="rounded-full border border-line px-4 py-3 text-center text-sm"
            >
              {t("nav.whyAster")}
            </Link>
            <Link
              href={guidesHubHrefForCategory(locale, "faq")}
              className="rounded-full border border-line px-4 py-3 text-center text-sm"
            >
              {t("nav.faqPage")}
            </Link>
            <Link href="/support" className="rounded-full border border-line px-4 py-3 text-center text-sm">
              {t("nav.support")}
            </Link>

            {user ? (
              <>
                <Link href="/my-info" className="rounded-full border border-line px-4 py-3 text-center text-sm">
                  {t("nav.myInfo")}
                </Link>
                <Link href="/subscription" className="rounded-full border border-line px-4 py-3 text-center text-sm">
                  {t("nav.subscription")}
                </Link>
                <LogoutButton className="rounded-full border border-line px-4 py-3 text-center text-sm" />
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-full border border-line px-4 py-3 text-center text-sm">
                  {t("home.header.login")}
                </Link>
                <Link href="/register" className="rounded-full bg-ink px-4 py-3 text-center text-sm text-paper">
                  {t("home.header.getStarted")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
