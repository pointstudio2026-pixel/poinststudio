"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  executeAsterBrain,
  fetchBrandStrategy,
  rebuildAsterBrain,
  selectBrandStrategy,
  type AiTextProvider,
  type BrandStrategyDataDto,
  type ConfidenceLevel,
} from "@/services/aster-brain-service";
import { Spinner } from "@/components/Spinner";
import { NextStepButton } from "@/features/workspace/NextStepButton";
import { AiProviderSelect } from "@/components/AiProviderSelect";

const TEXT_PROVIDERS: AiTextProvider[] = ["openai", "gemini", "claude"];

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
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>("");

  async function handleExecute() {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      await executeAsterBrain(projectId, provider ? (provider as AiTextProvider) : undefined);
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
      await rebuildAsterBrain(projectId, provider ? (provider as AiTextProvider) : undefined);
      await queryClient.invalidateQueries({ queryKey: ["aster-brain", projectId] });
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "재분석에 실패했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSelect(candidateIndex: number) {
    setIsSelecting(true);
    setSelectError(null);
    try {
      await selectBrandStrategy(projectId, candidateIndex);
      await queryClient.invalidateQueries({ queryKey: ["aster-brain", projectId] });
    } catch (err) {
      setSelectError(err instanceof Error ? err.message : "선택에 실패했습니다.");
    } finally {
      setIsSelecting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Spinner />
        <h1 className="text-lg font-medium">Aster Brain이 브랜드를 분석하고 있습니다...</h1>
        <p className="text-sm text-muted">
          인터뷰 답변과 선택한 스타일을 바탕으로 브랜드 전략 3가지 방향을 구성하는 중입니다.
        </p>
      </div>
    );
  }

  if (isError || !data) {
    const notGenerated = error instanceof Error && error.message.includes("생성되지 않았");
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-lg font-medium">
          {notGenerated ? "아직 브랜드 전략 분석이 없습니다" : "브랜드 전략을 불러오지 못했습니다"}
        </h1>
        <AiProviderSelect value={provider} onChange={setProvider} providers={TEXT_PROVIDERS} />
        <button
          type="button"
          onClick={handleExecute}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white"
        >
          Aster Brain 분석 시작
        </button>
        {analyzeError && <p className="text-sm text-red-600">{analyzeError}</p>}
      </div>
    );
  }

  const { strategy, versions } = data;
  const { candidates, selectedIndex } = strategy.currentVersion;

  if (selectedIndex === null) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-xl font-semibold">브랜드 전략 (Aster Brain)</h1>
          <p className="mt-1 text-sm text-muted">
            AI가 제안한 3가지 브랜드 전략 방향 중 하나를 선택해주세요.
          </p>
        </header>

        {selectError && <p className="text-sm text-red-600">{selectError}</p>}

        <div className="grid gap-4 sm:grid-cols-3">
          {candidates.map((candidate, index) => (
            <StrategyCandidateCard
              key={index}
              candidate={candidate}
              onSelect={() => handleSelect(index)}
              disabled={isSelecting}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <AiProviderSelect value={provider} onChange={setProvider} providers={TEXT_PROVIDERS} disabled={isSelecting} />
          <button
            type="button"
            onClick={handleRebuild}
            disabled={isSelecting}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            다른 방향으로 다시 생성
          </button>
        </div>
      </div>
    );
  }

  const { brandKnowledge, brandStrategy } = strategy.currentVersion.data;
  const confidence = CONFIDENCE_LABELS[strategy.currentVersion.confidenceLevel];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">브랜드 전략 (Aster Brain)</h1>
          <p className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
            v{strategy.currentVersion.versionNumber} · {versions.length}개 버전
            <span className={`rounded-full px-2 py-0.5 font-medium ${confidence.className}`}>
              {confidence.label}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AiProviderSelect value={provider} onChange={setProvider} providers={TEXT_PROVIDERS} />
          <button
            type="button"
            onClick={handleRebuild}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            재분석
          </button>
          <NextStepButton projectId={projectId} currentStepKey="brand_strategy" />
        </div>
      </header>

      {analyzeError && <p className="text-sm text-red-600">{analyzeError}</p>}

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">선택한 전략 방향: {brandStrategy.brandArchetype}</h2>
        <p className="mt-2 text-sm">{strategy.currentVersion.reasoningSummary}</p>
        <p className="mt-2 text-xs text-neutral-400">{brandKnowledge.confidenceNotes}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-neutral-200 p-4">
          <h2 className="text-sm font-medium text-neutral-700">브랜드 지식</h2>
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
          </dl>
        </div>

        <div className="rounded-md border border-neutral-200 p-4">
          <h2 className="text-sm font-medium text-neutral-700">브랜드 전략 초안</h2>
          <dl className="mt-2 flex flex-col gap-2 text-sm">
            <div>
              <dt className="text-xs text-neutral-400">브랜드 아키타입</dt>
              <dd>{brandStrategy.brandArchetype}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-400">톤 & 매너</dt>
              <dd>{brandStrategy.toneAndManner}</dd>
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
    </div>
  );
}

function StrategyCandidateCard({
  candidate,
  onSelect,
  disabled,
}: {
  candidate: BrandStrategyDataDto;
  onSelect: () => void;
  disabled: boolean;
}) {
  const { brandKnowledge, brandStrategy } = candidate;
  return (
    <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
      <div>
        <h3 className="text-sm font-semibold">{brandStrategy.brandArchetype}</h3>
        <p className="mt-1 text-xs text-neutral-500">{brandStrategy.toneAndManner}</p>
      </div>
      <p className="text-sm">{brandStrategy.positioning}</p>
      <p className="text-xs text-neutral-500">{brandKnowledge.reasoningSummary}</p>
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        className="mt-auto rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        이 전략으로 선택 확정
      </button>
    </div>
  );
}
