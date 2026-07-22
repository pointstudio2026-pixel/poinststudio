"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NewProjectButton } from "@/features/projects/NewProjectButton";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { LanguageSwitcher } from "@/features/navigation/LanguageSwitcher";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export interface PrimaryNavUser {
  email: string;
  name: string | null;
}

/**
 * Shared "로그인 상태" 데스크톱 nav — 랜딩 페이지 헤더, 대시보드 헤더, 프로젝트
 * 작업 화면 헤더 세 곳에서 동일하게 쓴다. "내 프로젝트"(호버 시 "새 프로젝트"
 * 노출) + "내 스타일"(Pro/Studio 전용) + "팀"(Studio 전용) + "사용방법"/
 * "문의사항"(항상 노출) 최상위 피어 링크 + 프로필 클릭 드롭다운(내 정보/
 * 결제정보/로그아웃) 구조.
 */
export function PrimaryNav({ user, planCode }: { user: PrimaryNavUser; planCode: PlanCode }) {
  const { t } = useTranslation();
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const displayName = user.name?.trim() || user.email.split("@")[0] || "";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div
        className="relative"
        onMouseEnter={() => setProjectsOpen(true)}
        onMouseLeave={() => {
          // 모달이 열려있는 동안은 마우스가 이 트리거 영역을 벗어나도(모달은
          // 화면 중앙에 고정 표시되므로 자연스럽게 벗어난다) 드롭다운을 접지
          // 않는다 -- 접히면 이 안에 렌더링된 NewProjectButton이 통째로
          // 언마운트되어 입력 중이던 모달까지 함께 사라져버렸다.
          if (!newProjectModalOpen) setProjectsOpen(false);
        }}
      >
        <Link
          href="/projects"
          className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink"
        >
          {t("nav.myProjects")}
        </Link>
        {projectsOpen && (
          <div className="absolute left-0 top-full w-40 pt-2">
            <div className="rounded-xl border border-line bg-surface p-1.5 shadow-soft">
              <NewProjectButton
                variant="menu-item"
                onOpenChange={(open) => {
                  setNewProjectModalOpen(open);
                  if (!open) setProjectsOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {planCode !== "free" && (
        <Link
          href="/my-styles"
          className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink"
        >
          {t("nav.myStyles")}
        </Link>
      )}

      {planCode === "studio" && (
        <Link
          href="/team"
          className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink"
        >
          {t("nav.team")}
        </Link>
      )}

      <Link
        href="/guide"
        className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink"
      >
        {t("nav.guide")}
      </Link>

      <Link
        href="/support"
        className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink"
      >
        {t("nav.support")}
      </Link>

      <div ref={profileRef} className="relative">
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-line py-1.5 pl-1.5 pr-3 text-sm transition hover:border-ink"
          aria-expanded={profileOpen}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-medium text-paper">
            {initial}
          </span>
          {displayName}
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-line bg-surface p-1.5 shadow-soft">
            <Link
              href="/my-info"
              className="block rounded-lg px-3 py-2 text-sm transition hover:bg-paper"
            >
              {t("nav.myInfo")}
            </Link>
            <Link
              href="/subscription"
              className="block rounded-lg px-3 py-2 text-sm transition hover:bg-paper"
            >
              {t("nav.subscription")}
            </Link>
            <LogoutButton className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-paper" />
          </div>
        )}
      </div>

      <LanguageSwitcher />
    </div>
  );
}
