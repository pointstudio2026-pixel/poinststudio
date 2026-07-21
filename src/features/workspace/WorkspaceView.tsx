"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteProject,
  updateProject,
  type ProjectDto,
} from "@/services/project-service";
import { getWorkspaceSteps } from "@/modules/projects/domain/Project";
import { STEP_ROUTES } from "@/features/workspace/stepRoutes";

type SaveStatus = "idle" | "editing" | "saving" | "saved" | "error";

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  idle: "",
  editing: "수정 중...",
  saving: "저장 중...",
  saved: "저장됨",
  error: "저장 실패",
};

const AUTOSAVE_DELAY_MS = 1500;

export function WorkspaceView({ project: initialProject }: { project: ProjectDto }) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [name, setName] = useState(initialProject.name);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveName = useCallback(
    async (value: string) => {
      setSaveStatus("saving");
      try {
        const { project: updated } = await updateProject(project.id, { name: value });
        setProject(updated);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    },
    [project.id],
  );

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timer = setTimeout(() => setSaveStatus("idle"), 2000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setName(value);
    setSaveStatus("editing");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveName(value), AUTOSAVE_DELAY_MS);
  }

  async function toggleFavorite() {
    const { project: updated } = await updateProject(project.id, {
      isFavorite: !project.isFavorite,
    });
    setProject(updated);
  }

  async function toggleArchive() {
    const { project: updated } = await updateProject(project.id, {
      archived: !project.archivedAt,
    });
    setProject(updated);
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "이 프로젝트를 삭제하시겠습니까? 삭제된 프로젝트는 휴지통으로 이동합니다.",
    );
    if (!confirmed) return;
    await deleteProject(project.id);
    router.push("/projects");
  }

  const steps = getWorkspaceSteps(project.deliverableType);
  const currentStepIndex = steps.findIndex((s) => s.key === project.currentStep);

  return (
    <div>
      <header className="flex items-center justify-between gap-4">
        <input
          value={name}
          onChange={handleNameChange}
          aria-label="프로젝트 이름"
          className="flex-1 border-b border-transparent px-1 py-1 text-xl font-semibold outline-none focus:border-line"
        />
        <button type="button" onClick={toggleFavorite} aria-label="즐겨찾기">
          {project.isFavorite ? "★" : "☆"}
        </button>
      </header>
      <p className="mt-1 h-4 text-xs text-muted">
        {SAVE_STATUS_LABELS[saveStatus]}
        {saveStatus === "error" && (
          <button type="button" onClick={() => saveName(name)} className="ml-2 underline">
            다시 시도
          </button>
        )}
      </p>

      <p className="eyebrow mt-6 text-sm text-muted">
        현재 단계: {steps[currentStepIndex]?.label ?? project.currentStep} (
        {currentStepIndex + 1}/{steps.length})
      </p>
      <div className="mt-4 rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm">
        {STEP_ROUTES[project.currentStep] ? (
          <Link
            href={`/projects/${project.id}/${STEP_ROUTES[project.currentStep]}`}
            className="rounded-full bg-ink px-4 py-2 text-paper transition hover:opacity-90"
          >
            {steps[currentStepIndex]?.label ?? project.currentStep} 이동
          </Link>
        ) : (
          <p className="text-muted">
            {steps[currentStepIndex]?.label ?? project.currentStep} 화면은 다음 작업에서
            구현됩니다.
          </p>
        )}
      </div>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={toggleArchive}
          className="rounded-full border border-line px-3 py-1.5 text-sm transition hover:border-ink"
        >
          {project.archivedAt ? "보관 해제" : "보관"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-full border border-red-300 px-3 py-1.5 text-sm text-red-600"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
