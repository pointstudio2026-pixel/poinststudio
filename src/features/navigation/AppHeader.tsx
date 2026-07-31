"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PrimaryNav, resolveNavGate, type NavItemKey, type PrimaryNavUser } from "@/features/navigation/PrimaryNav";
import { NewProjectButton } from "@/features/projects/NewProjectButton";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { LanguageSwitcher } from "@/features/navigation/LanguageSwitcher";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { guideDetailHref, guidesHubHref, guidesHubHrefForCategory } from "@/features/landingArticles/routing";

/**
 * 로그인 상태 앱 화면(내 프로젝트/프로젝트 작업화면/사용방법/문의사항)이
 * 공유하는 헤더 -- 로고 위치(mx-auto max-w-6xl px-5 sm:px-8 h-16)를
 * 랜딩 페이지 Header.tsx와 동일하게 맞춘다. children은 PrimaryNav
 * 왼쪽에 추가로 넣을 링크(예: 대시보드의 "디자인 메모리")용 슬롯.
 *
 * PrimaryNav는 hover로 열리는 드롭다운이라 터치 화면에서 못 쓰기 때문에
 * lg 미만에서는 숨기고(hidden lg:flex), 대신 랜딩 Header.tsx와 동일한
 * 탭 기반 세로 스택 메뉴를 여기서도 자체적으로 렌더링한다(2026-07-29,
 * 데스크톱 레이아웃/클래스는 그대로 두고 모바일 전용 경로만 추가).
 */
export function AppHeader({
  user,
  planCode,
  children,
}: {
  user: PrimaryNavUser | null;
  planCode: PlanCode | null;
  children?: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGateOpen, setMobileGateOpen] = useState<NavItemKey | null>(null);
  const { t, locale } = useTranslation();

  function mobileGateLink(key: NavItemKey, label: string, href: string) {
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
    <header className="border-b border-line">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="shrink-0">
          <Image src="/brand/aster-mark.png" alt="ASTER" width={351} height={400} sizes="30px" priority className="h-8 w-auto" />
        </Link>
        <div className="hidden items-center gap-2 lg:flex">
          {children}
          <PrimaryNav user={user} planCode={planCode} />
        </div>

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
          <div className="flex flex-col gap-2">
            <div className="flex justify-center pb-1">
              <LanguageSwitcher />
            </div>

            {children && <div className="flex justify-center pb-1">{children}</div>}

            {mobileGateLink("myProjects", t("nav.myProjects"), "/projects")}
            {resolveNavGate("newProject", user, planCode, t) ? (
              mobileGateLink("newProject", t("dashboard.newProject.button"), "/login")
            ) : (
              <div className="[&>button]:w-full [&>button]:justify-center [&>button]:py-3">
                <NewProjectButton />
              </div>
            )}
            {mobileGateLink("mockup", t("nav.mockup"), "/mockups/new")}
            {mobileGateLink("myWork", t("nav.myWork"), "/my-work")}
            {mobileGateLink("myStyles", t("nav.myStyles"), "/my-styles")}
            {mobileGateLink("team", t("nav.team"), "/team")}

            <Link href="/guide" className="rounded-full border border-line px-4 py-3 text-center text-sm" onClick={() => setMobileOpen(false)}>
              {t("nav.guide")}
            </Link>
            <Link
              href={guidesHubHref(locale)}
              className="rounded-full border border-line px-4 py-3 text-center text-sm"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.useCases")}
            </Link>
            <Link
              href={guideDetailHref(locale, "why-aster")}
              className="rounded-full border border-line px-4 py-3 text-center text-sm"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.whyAster")}
            </Link>
            <Link
              href={guidesHubHrefForCategory(locale, "faq")}
              className="rounded-full border border-line px-4 py-3 text-center text-sm"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.faqPage")}
            </Link>
            <Link href="/support" className="rounded-full border border-line px-4 py-3 text-center text-sm" onClick={() => setMobileOpen(false)}>
              {t("nav.support")}
            </Link>

            {user ? (
              <>
                <Link
                  href="/my-info"
                  className="rounded-full border border-line px-4 py-3 text-center text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.myInfo")}
                </Link>
                <Link
                  href="/subscription"
                  className="rounded-full border border-line px-4 py-3 text-center text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.subscription")}
                </Link>
                <LogoutButton className="rounded-full border border-line px-4 py-3 text-center text-sm" />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-line px-4 py-3 text-center text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("home.header.login")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-ink px-4 py-3 text-center text-sm text-paper"
                  onClick={() => setMobileOpen(false)}
                >
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
