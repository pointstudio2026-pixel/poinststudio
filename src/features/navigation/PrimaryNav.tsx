"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NewProjectButton } from "@/features/projects/NewProjectButton";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { LanguageSwitcher } from "@/features/navigation/LanguageSwitcher";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import type { MessageKey } from "@/shared/i18n/messages/types";
import { guideDetailHref, guidesHubHref, guidesHubHrefForCategory } from "@/features/landingArticles/routing";

export interface PrimaryNavUser {
  email: string;
  name: string | null;
}

export type NavItemKey = "myProjects" | "newProject" | "mockup" | "myWork" | "myStyles" | "team";

export interface Gate {
  message: string;
  ctaLabel: string;
  ctaHref: string;
}

/**
 * 로그인 여부/플랜에 따라 "내 프로젝트" 드롭다운의 각 항목이 실제 이동
 * 가능한지, 아니면 안내 문구 + CTA로 막아야 하는지 결정한다. 2026-07-28:
 * 로그인 안 한 방문자도 버튼 자체는 보이되(회원가입 유도), 로그인 상태에서
 * Free 플랜은 내 스타일/팀도 항상 보이되(숨기지 않음) 클릭 시 구독 안내로
 * 막는 방식으로 바뀌었다 -- 이전엔 planCode 조건에 안 맞으면 링크 자체를
 * 아예 렌더링하지 않았다.
 */
export function resolveNavGate(
  key: NavItemKey,
  user: PrimaryNavUser | null,
  planCode: PlanCode | null,
  t: (key: MessageKey) => string,
): Gate | null {
  // "목업" 단독 프로세스는 게스트도 3회까지 쓸 수 있게 열려 있어서(2026-07-31)
  // 로그인 여부와 무관하게 항상 실제 링크로 뜬다.
  if (key === "mockup") return null;
  if (!user) {
    return { message: t("nav.gate.loginMessage"), ctaLabel: t("nav.gate.loginCta"), ctaHref: "/login" };
  }
  if (key === "myStyles" && planCode === "free") {
    return { message: t("nav.gate.proMessage"), ctaLabel: t("nav.gate.subscriptionCta"), ctaHref: "/subscription" };
  }
  if (key === "team" && planCode !== "studio") {
    return { message: t("nav.gate.teamMessage"), ctaLabel: t("nav.gate.subscriptionCta"), ctaHref: "/subscription" };
  }
  return null;
}

const MENU_ITEM = "block w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-paper";

function GatePanel({ gate }: { gate: Gate }) {
  return (
    <div className="mx-1 mb-1 rounded-lg bg-paper px-3 py-2">
      <p className="text-xs text-muted">{gate.message}</p>
      <Link
        href={gate.ctaHref}
        className="mt-1.5 inline-block rounded-full bg-ink px-3 py-1 text-xs text-paper transition hover:opacity-90"
      >
        {gate.ctaLabel}
      </Link>
    </div>
  );
}

/**
 * Shared 데스크톱 nav — 랜딩 페이지 헤더, 대시보드 헤더, 프로젝트 작업 화면
 * 헤더 세 곳에서 동일하게 쓴다. 2026-07-28부터 로그인 여부와 무관하게
 * 항상 렌더링된다(user가 null이면 "비로그인" 모드) -- "내 프로젝트"에
 * 마우스를 올리면 내 프로젝트/새 프로젝트/목업/내 스타일/팀이 한 드롭다운
 * 안에 모여서 뜨고, 각 항목은 이용 가능하면 실제 링크로, 아니면 안내
 * 문구+CTA 버튼으로 막힌다(resolveGate) + "사용방법"/"문의사항"(항상 노출)
 * 최상위 피어 링크 + (로그인 시)프로필 클릭 드롭다운 또는 (비로그인
 * 시)로그인/회원가입 버튼.
 */
export function PrimaryNav({ user, planCode }: { user: PrimaryNavUser | null; planCode: PlanCode | null }) {
  const { t, locale } = useTranslation();
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState<NavItemKey | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
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

  const PILL = "whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-xs transition hover:border-ink";

  function closeProjectsDropdown() {
    setProjectsOpen(false);
    setGateOpen(null);
  }

  function renderGatedLink(key: NavItemKey, label: string, href: string) {
    const gate = resolveNavGate(key, user, planCode, t);
    if (!gate) {
      return (
        <Link href={href} className={MENU_ITEM} onClick={closeProjectsDropdown}>
          {label}
        </Link>
      );
    }
    return (
      <div>
        <button type="button" className={MENU_ITEM} onClick={() => setGateOpen(gateOpen === key ? null : key)}>
          {label}
        </button>
        {gateOpen === key && <GatePanel gate={gate} />}
      </div>
    );
  }

  const myProjectsGate = resolveNavGate("myProjects", user, planCode, t);
  const newProjectGate = resolveNavGate("newProject", user, planCode, t);

  return (
    <div className="flex items-center gap-2">
      <div
        className="relative"
        onMouseEnter={() => setProjectsOpen(true)}
        onMouseLeave={() => {
          // 모달이 열려있는 동안은 마우스가 이 트리거 영역을 벗어나도(모달은
          // 화면 중앙에 고정 표시되므로 자연스럽게 벗어난다) 드롭다운을 접지
          // 않는다 -- 접히면 이 안에 렌더링된 NewProjectButton이 통째로
          // 언마운트되어 입력 중이던 모달까지 함께 사라져버렸다.
          if (!newProjectModalOpen) closeProjectsDropdown();
        }}
      >
        {myProjectsGate ? (
          <button type="button" className={PILL} onClick={() => setGateOpen(gateOpen === "myProjects" ? null : "myProjects")}>
            {t("nav.myProjects")}
          </button>
        ) : (
          <Link href="/projects" className={PILL}>
            {t("nav.myProjects")}
          </Link>
        )}
        {projectsOpen && (
          <div className="absolute left-0 top-full w-52 pt-2">
            <div className="rounded-xl border border-line bg-surface p-1.5 shadow-soft">
              {renderGatedLink("myProjects", t("nav.myProjects"), "/projects")}
              {newProjectGate ? (
                <div>
                  <button
                    type="button"
                    className={MENU_ITEM}
                    onClick={() => setGateOpen(gateOpen === "newProject" ? null : "newProject")}
                  >
                    {t("dashboard.newProject.button")}
                  </button>
                  {gateOpen === "newProject" && <GatePanel gate={newProjectGate} />}
                </div>
              ) : (
                <NewProjectButton
                  variant="menu-item"
                  onOpenChange={(open) => {
                    setNewProjectModalOpen(open);
                    if (!open) setProjectsOpen(false);
                  }}
                />
              )}
              {renderGatedLink("mockup", t("nav.mockup"), "/mockups/new")}
              {renderGatedLink("myStyles", t("nav.myStyles"), "/my-styles")}
              {renderGatedLink("team", t("nav.team"), "/team")}
            </div>
          </div>
        )}
      </div>

      <div
        className="relative"
        onMouseEnter={() => setGuideOpen(true)}
        onMouseLeave={() => setGuideOpen(false)}
      >
        <Link href="/guide" className={PILL}>
          {t("nav.guide")}
        </Link>
        {guideOpen && (
          <div className="absolute left-0 top-full w-44 pt-2">
            <div className="rounded-xl border border-line bg-surface p-1.5 shadow-soft">
              <Link href="/guide" className="block rounded-lg px-3 py-2 text-sm transition hover:bg-paper">
                {t("nav.guide")}
              </Link>
              <Link href={guidesHubHref(locale)} className="block rounded-lg px-3 py-2 text-sm transition hover:bg-paper">
                {t("nav.useCases")}
              </Link>
              <Link href={guideDetailHref(locale, "why-aster")} className="block rounded-lg px-3 py-2 text-sm transition hover:bg-paper">
                {t("nav.whyAster")}
              </Link>
              <Link href={guidesHubHrefForCategory(locale, "faq")} className="block rounded-lg px-3 py-2 text-sm transition hover:bg-paper">
                {t("nav.faqPage")}
              </Link>
            </div>
          </div>
        )}
      </div>

      <Link href="/support" className={PILL}>
        {t("nav.support")}
      </Link>

      {user ? (
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line py-1 pl-1 pr-2.5 text-xs transition hover:border-ink"
            aria-expanded={profileOpen}
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-medium text-paper">
              {(user.name?.trim() || user.email.split("@")[0] || "").charAt(0).toUpperCase()}
            </span>
            <span className="max-w-[8rem] truncate">{user.name?.trim() || user.email.split("@")[0] || ""}</span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-line bg-surface p-1.5 shadow-soft">
              <Link href="/my-info" className="block rounded-lg px-3 py-2 text-sm transition hover:bg-paper">
                {t("nav.myInfo")}
              </Link>
              {renderGatedLink("myWork", t("nav.myWork"), "/my-work")}
              <Link href="/subscription" className="block rounded-lg px-3 py-2 text-sm transition hover:bg-paper">
                {t("nav.subscription")}
              </Link>
              <LogoutButton className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-paper" />
            </div>
          )}
        </div>
      ) : (
        <>
          <Link href="/login" className="whitespace-nowrap px-2.5 py-1.5 text-xs text-muted transition hover:text-ink">
            {t("home.header.login")}
          </Link>
          <Link
            href="/register"
            className="whitespace-nowrap rounded-full bg-ink px-4 py-1.5 text-xs text-paper transition hover:opacity-90"
          >
            {t("home.header.getStarted")}
          </Link>
        </>
      )}

      <LanguageSwitcher />
    </div>
  );
}
