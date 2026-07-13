"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  deleteProject,
  fetchProjectActivity,
  updateProject,
  type ProjectDto,
} from "@/services/project-service";
import { WORKSPACE_STEPS } from "@/modules/projects/domain/Project";
import { activityLabel } from "@/shared/activity/activityLabels";

type SaveStatus = "idle" | "editing" | "saving" | "saved" | "error";

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  idle: "",
  editing: "수정 중...",
  saving: "저장 중...",
  saved: "저장됨",
  error: "저장 실패",
};

// 아직 구현되지 않은 단계는 여기 없으면 자동으로 "다음 작업에서 구현됩니다"로 표시된다.
const STEP_ROUTES: Partial<Record<string, string>> = {
  brand_interview: "/interview",
  brand_brief: "/brand-brief",
  brand_strategy: "/aster-brain",
  style: "/styles",
  generation: "/generation",
  concept_board: "/concept-board",
  mockup: "/mockups",
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
    router.push("/dashboard");
  }

  const { data: activityData } = useQuery({
    queryKey: ["project-activity", project.id],
    queryFn: () => fetchProjectActivity(project.id),
  });

  const currentStepIndex = WORKSPACE_STEPS.findIndex((s) => s.key === project.currentStep);

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl gap-6 p-8">
      <aside className="w-48 flex-shrink-0">
        <Link href="/dashboard" className="text-sm underline">
          ← 대시보드
        </Link>
        <nav className="mt-4 flex flex-col gap-1">
          {WORKSPACE_STEPS.map((step, i) => (
            <span
              key={step.key}
              className={`rounded-md px-3 py-2 text-sm ${
                i === currentStepIndex
                  ? "bg-neutral-900 text-white"
                  : i < currentStepIndex
                    ? "text-neutral-700"
                    : "text-neutral-300"
              }`}
            >
              {step.label}
            </span>
          ))}
        </nav>
      </aside>

      <main className="flex-1">
        <header className="flex items-center justify-between gap-4">
          <input
            value={name}
            onChange={handleNameChange}
            aria-label="프로젝트 이름"
            className="flex-1 border-b border-transparent px-1 py-1 text-xl font-semibold focus:border-neutral-300 focus:outline-none"
          />
          <button type="button" onClick={toggleFavorite} aria-label="즐겨찾기">
            {project.isFavorite ? "★" : "☆"}
          </button>
        </header>
        <p className="mt-1 h-4 text-xs text-neutral-400">
          {SAVE_STATUS_LABELS[saveStatus]}
          {saveStatus === "error" && (
            <button
              type="button"
              onClick={() => saveName(name)}
              className="ml-2 underline"
            >
              다시 시도
            </button>
          )}
        </p>

        <p className="mt-6 text-sm text-neutral-500">
          현재 단계: {WORKSPACE_STEPS[currentStepIndex]?.label ?? project.currentStep} (
          {currentStepIndex + 1}/{WORKSPACE_STEPS.length})
        </p>
        <div className="mt-4 rounded-md border border-dashed border-neutral-300 p-8 text-center text-sm">
          {STEP_ROUTES[project.currentStep] ? (
            <Link
              href={`/projects/${project.id}${STEP_ROUTES[project.currentStep]}`}
              className="rounded-md bg-neutral-900 px-4 py-2 text-white"
            >
              {WORKSPACE_STEPS[currentStepIndex]?.label ?? project.currentStep} 이동
            </Link>
          ) : (
            <p className="text-neutral-400">
              {WORKSPACE_STEPS[currentStepIndex]?.label ?? project.currentStep} 화면은 다음 작업에서
              구현됩니다.
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={toggleArchive}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            {project.archivedAt ? "보관 해제" : "보관"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600"
          >
            삭제
          </button>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-neutral-700">활동 로그</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-500">
            {(activityData?.activity ?? []).map((entry) => (
              <li key={entry.id}>
                {activityLabel(entry.eventType)} ·{" "}
                {new Date(entry.createdAt).toLocaleString("ko-KR")}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
