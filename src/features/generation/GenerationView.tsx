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
import { Spinner } from "@/components/Spinner";

const POLL_INTERVAL_MS = 1500;

export function GenerationView({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

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

  async function handleStart() {
    setIsStarting(true);
    setActionError(null);
    try {
      const { generation } = await createGeneration(projectId);
      setActiveVersionId(generation.id);
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
                className="aspect-square w-full rounded-md border border-neutral-200 object-cover"
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
