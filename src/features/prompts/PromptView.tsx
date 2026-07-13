"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buildPrompt,
  fetchPrompt,
  fetchPromptVersions,
  type PromptProviderDto,
} from "@/services/prompts-service";
import { Spinner } from "@/components/Spinner";

const PROVIDERS: { value: PromptProviderDto; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Google Gemini" },
  { value: "nanobanana", label: "Nano Banana" },
];

export function PromptView({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<PromptProviderDto>("openai");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["prompt", projectId],
    queryFn: () => fetchPrompt(projectId),
    retry: false,
  });

  const { data: versionsData } = useQuery({
    queryKey: ["prompt-versions", projectId],
    queryFn: () => fetchPromptVersions(projectId),
    enabled: Boolean(data),
  });

  async function handleBuild() {
    setIsBuilding(true);
    setBuildError(null);
    try {
      await buildPrompt(projectId, provider);
      await queryClient.invalidateQueries({ queryKey: ["prompt", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["prompt-versions", projectId] });
    } catch (err) {
      setBuildError(err instanceof Error ? err.message : "Prompt 생성에 실패했습니다.");
    } finally {
      setIsBuilding(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const notBuilt = isError && error instanceof Error && error.message.includes("생성되지 않았");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Prompt Engine</h1>
        <Link href={`/projects/${projectId}`} className="text-sm underline">
          프로젝트로
        </Link>
      </header>

      <section className="rounded-md border border-neutral-200 p-4">
        <label className="text-xs font-medium text-neutral-500">Provider (관리자/실험용)</label>
        <div className="mt-2 flex gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setProvider(p.value)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                provider === p.value ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleBuild}
          disabled={isBuilding}
          className="mt-4 flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isBuilding && <Spinner />}
          Prompt 생성
        </button>
        {buildError && <p className="mt-2 text-sm text-red-600">{buildError}</p>}
        {notBuilt && !buildError && (
          <p className="mt-2 text-sm text-neutral-400">아직 생성된 Prompt가 없습니다. 위 버튼으로 생성하세요.</p>
        )}
      </section>

      {data?.prompt && (
        <section className="rounded-md border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-700">Prompt Preview</h2>
            <span className="text-xs text-neutral-400">
              v{data.prompt.currentVersion.versionNumber} · {data.prompt.currentVersion.provider}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-3 text-sm">
            <div>
              <p className="text-xs font-medium text-neutral-500">System Prompt</p>
              <p className="mt-1 whitespace-pre-wrap rounded-md bg-neutral-50 p-2">
                {data.prompt.currentVersion.systemPrompt}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">User Prompt</p>
              <p className="mt-1 whitespace-pre-wrap rounded-md bg-neutral-50 p-2">
                {data.prompt.currentVersion.userPrompt}
              </p>
            </div>
            {data.prompt.currentVersion.flaggedTerms.length > 0 && (
              <p className="text-xs text-amber-600">
                Safety Layer가 일부 표현을 일반화했습니다: {data.prompt.currentVersion.flaggedTerms.join(", ")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mt-3 text-xs underline"
          >
            {showAdvanced ? "고급 옵션 숨기기" : "고급 옵션 보기"}
          </button>
          {showAdvanced && (
            <dl className="mt-2 flex flex-col gap-1 text-xs text-neutral-500">
              <div>
                <dt className="inline font-medium">Model: </dt>
                <dd className="inline">{data.prompt.currentVersion.payload.model}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Parameters: </dt>
                <dd className="inline">{JSON.stringify(data.prompt.currentVersion.payload.parameters)}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Hash: </dt>
                <dd className="inline break-all">{data.prompt.currentVersion.hash}</dd>
              </div>
            </dl>
          )}
        </section>
      )}

      {versionsData && versionsData.versions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-700">버전 기록</h2>
          <ul className="flex flex-col gap-1">
            {versionsData.versions.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm"
              >
                <span>
                  v{v.versionNumber} · {v.provider} · {new Date(v.createdAt).toLocaleString("ko-KR")}
                </span>
                <span className="text-xs text-neutral-400">{v.hash.slice(0, 12)}...</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
