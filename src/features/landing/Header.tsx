"use client";

import { useState } from "react";
import Link from "next/link";
import { NewProjectButton } from "@/features/projects/NewProjectButton";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { PrimaryNav } from "@/features/navigation/PrimaryNav";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

const NAV_LINKS = [
  { href: "#top", label: "서비스" },
  { href: "#how-it-works", label: "사용 방법" },
  { href: "#preview", label: "결과 예시" },
  { href: "#pricing", label: "요금제" },
  { href: "#faq", label: "FAQ" },
  { href: "/support", label: "문의하기" },
];

export interface HeaderUser {
  email: string;
  name: string | null;
}

export function Header({ user, planCode }: { user: HeaderUser | null; planCode: PlanCode | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          ASTER.
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-ink">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <PrimaryNav user={user} planCode={planCode ?? "free"} />
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 text-sm text-muted transition hover:text-ink">
                로그인
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-ink px-5 py-2 text-sm text-paper transition hover:opacity-90"
              >
                무료로 시작하기
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line lg:hidden"
          aria-label="메뉴 열기"
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
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
            {user ? (
              <>
                <Link
                  href="/projects"
                  className="rounded-full border border-line px-4 py-3 text-center text-sm"
                >
                  내 프로젝트
                </Link>
                {planCode !== "free" && (
                  <Link
                    href="/my-styles"
                    className="rounded-full border border-line px-4 py-3 text-center text-sm"
                  >
                    내 스타일
                  </Link>
                )}
                {planCode === "studio" && (
                  <Link
                    href="/team"
                    className="rounded-full border border-line px-4 py-3 text-center text-sm"
                  >
                    팀
                  </Link>
                )}
                <Link
                  href="/guide"
                  className="rounded-full border border-line px-4 py-3 text-center text-sm"
                >
                  사용방법
                </Link>
                <div className="[&>button]:w-full [&>button]:justify-center [&>button]:py-3">
                  <NewProjectButton />
                </div>
                <Link
                  href="/my-info"
                  className="rounded-full border border-line px-4 py-3 text-center text-sm"
                >
                  내 정보
                </Link>
                <Link
                  href="/subscription"
                  className="rounded-full border border-line px-4 py-3 text-center text-sm"
                >
                  결제정보 (구독)
                </Link>
                <Link
                  href="/support"
                  className="rounded-full border border-line px-4 py-3 text-center text-sm"
                >
                  문의사항
                </Link>
                <LogoutButton className="rounded-full border border-line px-4 py-3 text-center text-sm" />
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-full border border-line px-4 py-3 text-center text-sm">
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-ink px-4 py-3 text-center text-sm text-paper"
                >
                  무료로 시작하기
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
