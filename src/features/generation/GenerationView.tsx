"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createGeneration,
  fetchGenerationHistory,
  fetchGenerationStatus,
  retryGeneration,
  type GenerationVersionDto,
} from "@/services/generations-service";
import {
  EDIT_PRESET_OPTIONS,
  createEdit,
  fetchEditHistory,
  retryEdit,
  type EditPresetKeyDto,
} from "@/services/edits-service";
import { Spinner } from "@/components/Spinner";

const POLL_INTERVAL_MS = 1500;

export function GenerationView({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [editVersionId, setEditVersionId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["generation-history", projectId],
    queryFn: () => fetchGenerationHistory(projectId),
    retry: false,
  });

  // Once the user explicitly starts a generation, poll that specific
  // version; otherwise fall back to whatever the project's history query
  // already loaded, with no extra effect needed to sync the two.
  const pollingVersionId = activeVersionId ?? historyData?.generation.currentVersion.id ?? null;

  const { data: statusData } = useQuery({
    queryKey: ["generation-status", pollingVersionId],
    queryFn: () => fetchGenerationStatus(pollingVersionId as string),
    enabled: Boolean(pollingVersionId),
    refetchInterval: (query) => {
      const status = query.state.data?.generation.status;
      return status === "pending" || status === "processing" ? POLL_INTERVAL_MS : false;
    },
  });

  const active: GenerationVersionDto | undefined =
    statusData?.generation ?? historyData?.generation.currentVersion;

  const { data: editStatusData } = useQuery({
    queryKey: ["generation-status", editVersionId],
    queryFn: () => fetchGenerationStatus(editVersionId as string),
    enabled: Boolean(editVersionId),
    refetchInterval: (query) => {
      const status = query.state.data?.generation.status;
      return status === "pending" || status === "processing" ? POLL_INTERVAL_MS : false;
    },
  });
  const editResult = editStatusData?.generation;

  const generationId = historyData?.generation.id;
  const { data: editHistoryData } = useQuery({
    queryKey: ["edit-history", generationId],
    queryFn: () => fetchEditHistory(generationId as string),
    enabled: Boolean(generationId) && showHistory,
  });

  async function handleStart() {
    setIsStarting(true);
    setActionError(null);
    try {
      const { generation } = await createGeneration(projectId);
      setActiveVersionId(generation.id);
      setSelectedImageIndex(null);
      setEditVersionId(null);
      await queryClient.invalidateQueries({ queryKey: ["generation-history", projectId] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "이미지 생성 요청에 실패했습니다.");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleRetry(generationVersionId: string) {
    setActionError(null);
    try {
      const { generation } = await retryGeneration(generationVersionId);
      setActiveVersionId(generation.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "재시도에 실패했습니다.");
    }
  }

  async function handleEditPreset(presetKey: EditPresetKeyDto) {
    if (!active || selectedImageIndex === null) return;
    setIsEditing(true);
    setActionError(null);
    try {
      const { edit } = await createEdit(projectId, active.id, selectedImageIndex, presetKey);
      setEditVersionId(edit.resultVersionId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "원클릭 수정에 실패했습니다.");
    } finally {
      setIsEditing(false);
    }
  }

  async function handleRetryEdit(editId: string) {
    setActionError(null);
    try {
      const { edit } = await retryEdit(editId);
      setEditVersionId(edit.resultVersionId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "수정 재시도에 실패했습니다.");
    }
  }

  if (isLoadingHistory) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Generation</h1>
        <div className="flex items-center gap-2">
          <Link href={`/projects/${projectId}`} className="text-sm underline">
            프로젝트로
          </Link>
          {generationId && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            >
              수정 이력
            </button>
          )}
          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting}
            className="flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isStarting && <Spinner />}
            새로 생성
          </button>
        </div>
      </header>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {!active && (
        <div className="mt-8 rounded-md border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
          아직 생성된 이미지가 없습니다. &quot;새로 생성&quot; 버튼으로 브랜드 컨셉 이미지를 만들어보세요.
        </div>
      )}

      {active && (active.status === "pending" || active.status === "processing") && (
        <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-md border border-neutral-200 p-12 text-center">
          <Spinner />
          <p className="text-sm text-neutral-500">
            {active.status === "pending" ? "생성 대기 중입니다..." : "AI가 컨셉 이미지를 생성하고 있습니다..."}
          </p>
          <div className="grid w-full grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-square animate-pulse rounded-md bg-neutral-100" />
            ))}
          </div>
        </div>
      )}

      {active?.status === "failed" && (
        <div className="mt-8 rounded-md border border-red-200 p-6 text-center">
          <p className="text-sm text-red-600">생성에 실패했습니다: {active.errorMessage}</p>
          <button
            type="button"
            onClick={() => handleRetry(active.id)}
            className="mt-3 rounded-md border border-neutral-300 px-4 py-2 text-sm"
          >
            다시 시도
          </button>
        </div>
      )}

      {active?.status === "completed" && (
        <section>
          <div className="mb-2 flex items-center justify-between text-xs text-neutral-400">
            <span>
              v{active.versionNumber} · {active.provider} · {active.images.length}개 컨셉
            </span>
            <button type="button" onClick={() => handleRetry(active.id)} className="underline">
              같은 조건으로 재시도
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {active.images.map((image, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={image.url}
                alt={`Concept ${i + 1}`}
                onClick={() => setSelectedImageIndex(i)}
                className={`aspect-square w-full cursor-pointer rounded-md border object-cover ${
                  selectedImageIndex === i ? "border-neutral-900 ring-2 ring-neutral-900" : "border-neutral-200"
                }`}
              />
            ))}
          </div>

          {selectedImageIndex !== null && (
            <div className="mt-4 rounded-md border border-neutral-200 p-4">
              <p className="text-sm font-medium text-neutral-700">
                이미지 {selectedImageIndex + 1} 원클릭 수정
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {EDIT_PRESET_OPTIONS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handleEditPreset(preset.key)}
                    disabled={isEditing}
                    className="rounded-full border border-neutral-300 px-3 py-1 text-xs disabled:opacity-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {editResult && (editResult.status === "pending" || editResult.status === "processing") && (
                <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
                  <Spinner />
                  수정 적용 중...
                </div>
              )}

              {editResult?.status === "failed" && (
                <div className="mt-4 text-sm text-red-600">
                  수정에 실패했습니다: {editResult.errorMessage}
                </div>
              )}

              {editResult?.status === "completed" && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-neutral-500">Before / After</p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={active.images[selectedImageIndex]?.url}
                      alt="Before"
                      className="aspect-square w-full rounded-md border border-neutral-200 object-cover"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editResult.images[0]?.url}
                      alt="After"
                      className="aspect-square w-full rounded-md border border-neutral-900 object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {showHistory && (
        <section className="rounded-md border border-neutral-200 p-4">
          <h2 className="text-sm font-medium text-neutral-700">수정 이력</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {(editHistoryData?.history ?? []).map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm"
              >
                <span>
                  {EDIT_PRESET_OPTIONS.find((p) => p.key === entry.presetKey)?.label ?? entry.presetKey} ·{" "}
                  {entry.status} · {new Date(entry.createdAt).toLocaleString("ko-KR")}
                </span>
                {entry.status === "failed" && (
                  <button type="button" onClick={() => handleRetryEdit(entry.id)} className="text-xs underline">
                    재시도
                  </button>
                )}
              </li>
            ))}
            {editHistoryData?.history.length === 0 && (
              <li className="text-sm text-neutral-400">아직 수정 이력이 없습니다.</li>
            )}
          </ul>
        </section>
      )}
    </main>
  );
}
