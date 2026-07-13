"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  executeAsterBrain,
  fetchBrandStrategy,
  rebuildAsterBrain,
  type ConfidenceLevel,
} from "@/services/aster-brain-service";
import { Spinner } from "@/components/Spinner";

const CONFIDENCE_LABELS: Record<ConfidenceLevel, { label: string; className: string }> = {
  high: { label: "신뢰도 높음", className: "bg-green-100 text-green-700" },
  medium: { label: "신뢰도 보통", className: "bg-amber-100 text-amber-700" },
  low: { label: "신뢰도 낮음", className: "bg-red-100 text-red-700" },
};

export function AsterBrainView({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["aster-brain", projectId],
    queryFn: () => fetchBrandStrategy(projectId),
    retry: false,
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  async function handleExecute() {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      await executeAsterBrain(projectId);
      await queryClient.invalidateQueries({ queryKey: ["aster-brain", projectId] });
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "분석에 실패했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleRebuild() {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      await rebuildAsterBrain(projectId);
      await queryClient.invalidateQueries({ queryKey: ["aster-brain", projectId] });
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "재분석에 실패했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
        <Spinner />
        <h1 className="text-lg font-medium">Aster Brain이 브랜드를 분석하고 있습니다...</h1>
        <p className="text-sm text-neutral-500">
          Brand Brief를 바탕으로 브랜드 지식과 전략 초안을 구성하는 중입니다.
        </p>
      </main>
    );
  }

  if (isError || !data) {
    const notGenerated = error instanceof Error && error.message.includes("생성되지 않았");
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-lg font-medium">
          {notGenerated ? "아직 Brand Strategy 분석이 없습니다" : "Brand Strategy를 불러오지 못했습니다"}
        </h1>
        <button
          type="button"
          onClick={handleExecute}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white"
        >
          Aster Brain 분석 시작
        </button>
        {analyzeError && <p className="text-sm text-red-600">{analyzeError}</p>}
        <Link href={`/projects/${projectId}`} className="text-sm underline">
          프로젝트로 돌아가기
        </Link>
      </main>
    );
  }

  const { strategy, versions } = data;
  const { brandKnowledge, brandStrategy, styleCandidates } = strategy.currentVersion.data;
  const confidence = CONFIDENCE_LABELS[strategy.currentVersion.confidenceLevel];

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Brand Strategy (Aster Brain)</h1>
          <p className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
            v{strategy.currentVersion.versionNumber} · {versions.length}개 버전
            <span className={`rounded-full px-2 py-0.5 font-medium ${confidence.className}`}>
              {confidence.label}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/projects/${projectId}`} className="text-sm underline">
            프로젝트로
          </Link>
          <button
            type="button"
            onClick={handleRebuild}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            재분석
          </button>
        </div>
      </header>

      {analyzeError && <p className="text-sm text-red-600">{analyzeError}</p>}

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">분석 요약</h2>
        <p className="mt-2 text-sm">{strategy.currentVersion.reasoningSummary}</p>
        <p className="mt-2 text-xs text-neutral-400">{brandKnowledge.confidenceNotes}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-neutral-200 p-4">
          <h2 className="text-sm font-medium text-neutral-700">Brand Knowledge</h2>
          <dl className="mt-2 flex flex-col gap-2 text-sm">
            <div>
              <dt className="text-xs text-neutral-400">미션</dt>
              <dd>{brandKnowledge.mission || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-400">비전</dt>
              <dd>{brandKnowledge.vision || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-400">핵심 가치</dt>
              <dd>{brandKnowledge.values.length > 0 ? brandKnowledge.values.join(", ") : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-400">포지셔닝</dt>
              <dd>{brandKnowledge.positioning || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-400">타깃 고객</dt>
              <dd>{brandKnowledge.audience || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-400">톤 & 성격</dt>
              <dd>
                {brandKnowledge.tone} / {brandKnowledge.personality}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-md border border-neutral-200 p-4">
          <h2 className="text-sm font-medium text-neutral-700">Brand Strategy 초안</h2>
          <dl className="mt-2 flex flex-col gap-2 text-sm">
            <div>
              <dt className="text-xs text-neutral-400">브랜드 아키타입</dt>
              <dd>{brandStrategy.brandArchetype}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-400">핵심 메시지</dt>
              <dd>{brandStrategy.coreMessage || "—"}</dd>
            </div>
            {(
              [
                ["추천 스타일", brandStrategy.recommendedStyles],
                ["추천 컬러", brandStrategy.recommendedColors],
                ["추천 타이포그래피", brandStrategy.recommendedTypography],
                ["추천 심볼", brandStrategy.recommendedSymbols],
              ] as const
            ).map(([label, items]) => (
              <div key={label}>
                <dt className="text-xs text-neutral-400">{label}</dt>
                {items.map((item) => (
                  <dd key={item.value}>
                    {item.value}
                    <span className="ml-1 text-xs text-neutral-400">({item.reason})</span>
                  </dd>
                ))}
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">Style 후보</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {styleCandidates.map((candidate) => (
            <li key={candidate.name}>
              <span className="font-medium">{candidate.name}</span>
              <span className="ml-2 text-xs text-neutral-400">{candidate.reason}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
