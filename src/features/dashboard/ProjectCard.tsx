"use client";

import { useState } from "react";
import Link from "next/link";
import type { DashboardProjectDto } from "@/services/dashboard-service";
import { deleteProject, shareProjectWithTeam } from "@/services/project-service";
import { getWorkspaceSteps } from "@/modules/projects/domain/Project";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  progress: "진행 중",
  completed: "완료",
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
  const steps = getWorkspaceSteps(project.deliverableType);
  const stepIndex = steps.findIndex((s) => s.key === project.currentStep);
  const stepLabel = steps[stepIndex]?.label ?? project.currentStep;

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
    const confirmed = window.confirm(
      `"${project.name}" 프로젝트를 삭제하시겠습니까? 삭제된 프로젝트는 휴지통으로 이동합니다.`,
    );
    if (!confirmed) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await deleteProject(project.id);
      setMenuOpen(false);
      onDeleted();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
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
      setActionError(err instanceof Error ? err.message : "공유 설정에 실패했습니다.");
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
            <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">공유됨</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {project.isFavorite && <span aria-label="즐겨찾기">★</span>}
          {project.isOwner && (
            <button
              type="button"
              aria-label="프로젝트 메뉴"
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
                {isSharing ? "처리 중..." : project.sharedWithTeam ? "팀 공유 끄기" : "팀에 공유"}
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
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
        <span>
          {stepIndex + 1}/{steps.length} · {stepLabel}
        </span>
        <span className="rounded-full border border-line px-2 py-0.5">
          {STATUS_LABELS[project.status] ?? project.status}
        </span>
      </div>
      <span className="text-xs text-muted">{new Date(project.updatedAt).toLocaleDateString("ko-KR")} 수정</span>
    </Link>
  );
}
