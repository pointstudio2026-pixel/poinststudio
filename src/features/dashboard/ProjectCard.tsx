"use client";

import { useState } from "react";
import Link from "next/link";
import type { DashboardProjectDto } from "@/services/dashboard-service";
import { deleteProject, shareProjectWithTeam } from "@/services/project-service";
import { getWorkspaceSteps } from "@/modules/projects/domain/Project";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";
import { INTL_LOCALE } from "@/shared/i18n/locale";

const STATUS_LABEL_KEYS: Record<string, MessageKey> = {
  draft: "dashboard.card.status.draft",
  progress: "dashboard.card.status.progress",
  completed: "dashboard.card.status.completed",
};

/** getWorkspaceSteps()의 도메인 라벨은 건드리지 않고, 이 카드의 표시용으로만
 * step.key -> MessageKey를 로컬로 매핑한다. */
const WORKSPACE_STEP_LABEL_KEYS: Record<string, MessageKey> = {
  deliverable_type: "dashboard.card.steps.deliverableType",
  brand_interview: "dashboard.card.steps.brandInterview",
  style: "dashboard.card.steps.style",
  brand_strategy: "dashboard.card.steps.brandStrategy",
  logo_style: "dashboard.card.steps.logoStyle",
  generation: "dashboard.card.steps.generation",
  concept_board: "dashboard.card.steps.conceptBoard",
  mockup: "dashboard.card.steps.mockup",
};

export function ProjectCard({
  project,
  planCode,
  onDeleted,
}: {
  project: DashboardProjectDto;
  planCode: PlanCode;
  onDeleted: () => void;
}) {
  const { t, locale } = useTranslation();
  const steps = getWorkspaceSteps(project.deliverableType);
  const stepIndex = steps.findIndex((s) => s.key === project.currentStep);
  const stepLabelKey = WORKSPACE_STEP_LABEL_KEYS[project.currentStep];
  const stepLabel = stepLabelKey ? t(stepLabelKey) : project.currentStep;

  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // 공유 켜기는 Studio 전용이지만, 이미 켜진 걸 끄는 건 플랜과 무관하게
  // 항상 허용한다 -- 안 그러면 Studio를 해지한 소유자가 예전에 공유해둔
  // 프로젝트를 다시 비공개로 되돌릴 방법이 없어진다.
  const canToggleShare = project.isOwner && (planCode === "studio" || project.sharedWithTeam);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = window.confirm(t("dashboard.card.deleteConfirm", { name: project.name }));
    if (!confirmed) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await deleteProject(project.id);
      setMenuOpen(false);
      onDeleted();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("dashboard.card.deleteFailed"));
      setIsDeleting(false);
    }
  }

  async function handleToggleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsSharing(true);
    setActionError(null);
    try {
      await shareProjectWithTeam(project.id, !project.sharedWithTeam);
      setMenuOpen(false);
      onDeleted();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("dashboard.card.shareFailed"));
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <Link
      href={`/projects/${project.id}`}
      className="relative flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 text-left transition hover:border-ink"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <span className="font-medium">{project.name}</span>
          {!project.isOwner && (
            <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">{t("dashboard.card.shared")}</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {project.isFavorite && <span aria-label={t("dashboard.card.favorite")}>★</span>}
          {project.isOwner && (
            <button
              type="button"
              aria-label={t("dashboard.card.menu")}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="rounded-full px-1.5 py-0.5 text-muted transition hover:bg-line/40 hover:text-ink"
            >
              ⋯
            </button>
          )}
        </div>
      </div>

      {menuOpen && (
        <>
          {/* 바깥 클릭 시 닫기 -- Link 네비게이션은 이 오버레이가 막는다. */}
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(false);
            }}
          />
          <div className="absolute right-4 top-11 z-20 w-40 overflow-hidden rounded-xl border border-line bg-paper shadow-soft">
            {canToggleShare && (
              <button
                type="button"
                onClick={handleToggleShare}
                disabled={isSharing}
                className="w-full px-3 py-2 text-left text-sm transition hover:bg-line/20 disabled:opacity-50"
              >
                {isSharing ? t("dashboard.card.sharing") : project.sharedWithTeam ? t("dashboard.card.unshare") : t("dashboard.card.share")}
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              {isDeleting ? t("dashboard.card.deleting") : t("dashboard.card.delete")}
            </button>
          </div>
        </>
      )}

      {actionError && <p className="text-xs text-red-600">{actionError}</p>}

      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <span
            key={step.key}
            className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-ink" : "bg-line"}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>{t("dashboard.card.progress", { current: stepIndex + 1, total: steps.length, step: stepLabel })}</span>
        <span className="rounded-full border border-line px-2 py-0.5">
          {(() => {
            const key = STATUS_LABEL_KEYS[project.status];
            return key ? t(key) : project.status;
          })()}
        </span>
      </div>
      <span className="text-xs text-muted">
        {t("dashboard.card.updatedAt", { date: new Date(project.updatedAt).toLocaleDateString(INTL_LOCALE[locale]) })}
      </span>
    </Link>
  );
}
