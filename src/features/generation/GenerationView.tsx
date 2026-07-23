"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createGeneration,
  fetchGenerationHistory,
  fetchGenerationStatus,
  retryGeneration,
  MAX_PROJECT_RESULTS,
  type AiImageProvider,
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
import { ImageLightbox } from "@/components/ImageLightbox";
import { GenerationFeedbackWidget } from "@/features/generation/GenerationFeedbackWidget";
import { NextStepButton } from "@/features/workspace/NextStepButton";
import { AiProviderSelect } from "@/components/AiProviderSelect";
import { ApiError } from "@/services/http-client";
import { resendVerificationEmail } from "@/services/auth-service";

const POLL_INTERVAL_MS = 1500;
const IMAGE_PROVIDERS: AiImageProvider[] = ["openai", "gemini"];

export function GenerationView({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [pendingVersionId, setPendingVersionId] = useState<string | null>(null);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [provider, setProvider] = useState<string>("");
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [customInstructionDraft, setCustomInstructionDraft] = useState("");

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["generation-history", projectId],
    queryFn: () => fetchGenerationHistory(projectId),
    retry: false,
  });

  const versions = historyData?.versions ?? [];
  const latestVersion = versions[0] ?? null;
  const completedVersions = versions
    .filter((v) => v.status === "completed")
    .sort((a, b) => a.versionNumber - b.versionNumber);

  // 명시적으로 시작한 생성/수정이 없으면 마지막 버전을 대신 폴링한다 -- 새로고침
  // 직후에도 진행 중이거나 실패한 상태를 이어서 보여주기 위함.
  const pollingVersionId = pendingVersionId ?? latestVersion?.id ?? null;

  const { data: statusData } = useQuery({
    queryKey: ["generation-status", pollingVersionId],
    queryFn: () => fetchGenerationStatus(pollingVersionId as string),
    enabled: Boolean(pollingVersionId),
    refetchInterval: (query) => {
      const status = query.state.data?.generation.status;
      return status === "pending" || status === "processing" ? POLL_INTERVAL_MS : false;
    },
  });

  const current: GenerationVersionDto | undefined = statusData?.generation ?? latestVersion ?? undefined;

  useEffect(() => {
    const status = statusData?.generation.status;
    if (status === "completed" || status === "failed") {
      void queryClient.invalidateQueries({ queryKey: ["generation-history", projectId] });
    }
  }, [statusData?.generation.status, statusData?.generation.id, queryClient, projectId]);

  const generationId = historyData?.generation.id;
  const { data: editHistoryData } = useQuery({
    queryKey: ["edit-history", generationId],
    queryFn: () => fetchEditHistory(generationId as string),
    enabled: Boolean(generationId) && showHistory,
  });

  const isPending = current?.status === "pending" || current?.status === "processing";
  const capReached = versions.filter((v) => v.status !== "failed").length >= MAX_PROJECT_RESULTS;
  const actionsDisabled = isSubmitting || isPending || capReached;

  async function handleGenerate() {
    setIsSubmitting(true);
    setActionError(null);
    setNeedsEmailVerification(false);
    try {
      const { generation } = await createGeneration(projectId, provider ? (provider as AiImageProvider) : undefined);
      setPendingVersionId(generation.id);
      setPendingEditId(null);
      await queryClient.invalidateQueries({ queryKey: ["generation-history", projectId] });
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        setNeedsEmailVerification(true);
      }
      setActionError(err instanceof Error ? err.message : "이미지 생성 요청에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendVerification() {
    try {
      await resendVerificationEmail();
      setResendSent(true);
    } catch {
      // 배너의 재발송과 동일한 액션이라 별도 에러 문구 없이 조용히 실패한다.
    }
  }

  async function handlePreset(presetKey: EditPresetKeyDto) {
    const source = completedVersions[completedVersions.length - 1];
    if (!source) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const { edit } = await createEdit(projectId, source.id, 0, { presetKey });
      setPendingVersionId(edit.resultVersionId);
      setPendingEditId(edit.id);
      await queryClient.invalidateQueries({ queryKey: ["generation-history", projectId] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "원클릭 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCustomEdit() {
    const instruction = customInstructionDraft.trim();
    const source = completedVersions[completedVersions.length - 1];
    if (!source || !instruction) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const { edit } = await createEdit(projectId, source.id, 0, { customInstruction: instruction });
      setPendingVersionId(edit.resultVersionId);
      setPendingEditId(edit.id);
      setCustomInstructionDraft("");
      await queryClient.invalidateQueries({ queryKey: ["generation-history", projectId] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "수정 요청에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRetryFailed() {
    if (!pollingVersionId) return;
    setActionError(null);
    try {
      if (pendingEditId) {
        const { edit } = await retryEdit(pendingEditId);
        setPendingVersionId(edit.resultVersionId);
        setPendingEditId(edit.id);
      } else {
        const { generation } = await retryGeneration(pollingVersionId);
        setPendingVersionId(generation.id);
        setPendingEditId(null);
      }
      await queryClient.invalidateQueries({ queryKey: ["generation-history", projectId] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "재시도에 실패했습니다.");
    }
  }

  async function handleRetryEdit(editId: string) {
    setActionError(null);
    try {
      const { edit } = await retryEdit(editId);
      setPendingVersionId(edit.resultVersionId);
      setPendingEditId(edit.id);
      await queryClient.invalidateQueries({ queryKey: ["generation-history", projectId] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "수정 재시도에 실패했습니다.");
    }
  }

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">이미지 생성</h1>
        <div className="flex items-center gap-2">
          {generationId && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            >
              수정 이력
            </button>
          )}
          {completedVersions.length > 0 && <NextStepButton projectId={projectId} currentStepKey="generation" />}
          <AiProviderSelect value={provider} onChange={setProvider} providers={IMAGE_PROVIDERS} disabled={actionsDisabled} />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={actionsDisabled}
            className="flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isSubmitting && <Spinner />}
            새로 생성
          </button>
        </div>
      </header>

      {actionError && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <p>{actionError}</p>
          {needsEmailVerification && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendSent}
              className="rounded-full border border-red-300 px-3 py-1 text-xs disabled:opacity-50"
            >
              {resendSent ? "발송됨" : "인증 메일 재발송"}
            </button>
          )}
        </div>
      )}

      {capReached && (
        <p className="text-xs text-neutral-400">
          이 프로젝트는 최대 {MAX_PROJECT_RESULTS}개까지 생성했습니다. 새 프로젝트를 만들면 다시 생성할 수 있습니다.
        </p>
      )}

      {versions.length === 0 && (
        <div className="mt-8 rounded-md border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
          아직 생성된 이미지가 없습니다. &quot;새로 생성&quot; 버튼으로 브랜드 컨셉 이미지를 만들어보세요.
        </div>
      )}

      {completedVersions.length > 0 && (
        <section>
          <div className="mb-2 text-xs text-neutral-400">
            결과 {completedVersions.length}/{MAX_PROJECT_RESULTS}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {completedVersions.map((version, i) => (
              <div key={version.id} className="flex flex-col gap-2">
                <div className="relative w-full overflow-hidden rounded-md border border-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={version.images[0]?.url} alt={`결과 ${i + 1}`} className="block h-auto w-full" />
                  <button
                    type="button"
                    onClick={() => setLightboxImage({ url: version.images[0]!.url, alt: `결과 ${i + 1}` })}
                    aria-label="크게 보기"
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900/80 text-white shadow-soft backdrop-blur-sm transition hover:bg-neutral-900"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                    결과 {i + 1}
                  </span>
                </div>
                <GenerationFeedbackWidget generationVersionId={version.id} />
              </div>
            ))}
          </div>

          {!capReached && (
            <div className="mt-4 rounded-md border border-neutral-200 p-4">
              <p className="text-sm font-medium text-neutral-700">더 만들어보기</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {EDIT_PRESET_OPTIONS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handlePreset(preset.key)}
                    disabled={actionsDisabled}
                    className="rounded-full border border-neutral-300 px-3 py-1 text-xs disabled:opacity-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-xs text-neutral-400">또는 직접 입력해서 수정 요청하기</p>
              <div className="mt-2 flex flex-col gap-2">
                <textarea
                  value={customInstructionDraft}
                  onChange={(e) => setCustomInstructionDraft(e.target.value)}
                  disabled={actionsDisabled}
                  rows={2}
                  maxLength={500}
                  placeholder="예: 로고를 더 둥글게 만들어줘"
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleCustomEdit}
                  disabled={actionsDisabled || !customInstructionDraft.trim()}
                  className="flex w-fit items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  {isSubmitting && <Spinner />}
                  수정 요청
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {isPending && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-neutral-200 p-12 text-center">
          <Spinner />
          <p className="text-sm text-neutral-500">
            {current?.status === "pending" ? "생성 대기 중입니다..." : "AI가 컨셉 이미지를 생성하고 있습니다..."}
          </p>
        </div>
      )}

      {!isPending && current?.status === "failed" && (
        <div className="rounded-md border border-red-200 p-6 text-center">
          <p className="text-sm text-red-600">생성에 실패했습니다: {current.errorMessage}</p>
          <button
            type="button"
            onClick={handleRetryFailed}
            disabled={isSubmitting}
            className="mt-3 rounded-md border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50"
          >
            다시 시도
          </button>
        </div>
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
                  {entry.customInstruction
                    ? `직접 입력: ${entry.customInstruction}`
                    : (EDIT_PRESET_OPTIONS.find((p) => p.key === entry.presetKey)?.label ?? entry.presetKey)}{" "}
                  · {entry.status} · {new Date(entry.createdAt).toLocaleString("ko-KR")}
                </span>
                {entry.status === "failed" && (
                  <button
                    type="button"
                    onClick={() => handleRetryEdit(entry.id)}
                    disabled={actionsDisabled}
                    className="text-xs underline disabled:opacity-50"
                  >
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

      {lightboxImage && (
        <ImageLightbox src={lightboxImage.url} alt={lightboxImage.alt} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
}
