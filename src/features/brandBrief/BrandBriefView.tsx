"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchBrandBrief,
  generateBrandBrief,
  restoreBrandBriefVersion,
  updateBrandBrief,
  type BrandBriefDataDto,
} from "@/services/brand-brief-service";
import { Spinner } from "@/components/Spinner";

type FieldKey = keyof BrandBriefDataDto;
type ListFieldKey = "coreValues" | "keywords" | "avoidKeywords";

const TEXT_FIELDS: { key: FieldKey; label: string }[] = [
  { key: "brandName", label: "브랜드명" },
  { key: "industry", label: "업종" },
  { key: "tagline", label: "태그라인" },
  { key: "description", label: "설명" },
  { key: "mission", label: "미션" },
  { key: "vision", label: "비전" },
  { key: "positioning", label: "포지셔닝" },
  { key: "primaryAudience", label: "주요 타깃" },
  { key: "secondaryAudience", label: "보조 타깃" },
  { key: "customerProblems", label: "고객 문제/경쟁 환경" },
  { key: "desiredImpression", label: "원하는 인상" },
  { key: "brandTone", label: "브랜드 톤" },
  { key: "brandPersonality", label: "브랜드 성격" },
  { key: "preferredStyle", label: "선호 스타일" },
  { key: "preferredColor", label: "선호 컬러" },
  { key: "preferredSymbol", label: "선호 심볼" },
  { key: "typographyDirection", label: "타이포그래피 방향" },
];

const LIST_FIELDS: { key: ListFieldKey; label: string }[] = [
  { key: "coreValues", label: "핵심 가치" },
  { key: "keywords", label: "키워드" },
  { key: "avoidKeywords", label: "피하고 싶은 키워드" },
];

export function BrandBriefView({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["brand-brief", projectId],
    queryFn: () => fetchBrandBrief(projectId),
    retry: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<BrandBriefDataDto | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  function startEditing() {
    if (!data?.brief) return;
    setForm(data.brief.currentVersion.data);
    setIsEditing(true);
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      await generateBrandBrief(projectId);
      await queryClient.invalidateQueries({ queryKey: ["brand-brief", projectId] });
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Brand Brief 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    if (!form) return;
    setSaveStatus("saving");
    try {
      await updateBrandBrief(projectId, form);
      await queryClient.invalidateQueries({ queryKey: ["brand-brief", projectId] });
      setSaveStatus("saved");
      setIsEditing(false);
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleRestore(versionNumber: number) {
    await restoreBrandBriefVersion(projectId, versionNumber);
    await queryClient.invalidateQueries({ queryKey: ["brand-brief", projectId] });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    const notGenerated = error instanceof Error && error.message.includes("생성되지 않았");
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-lg font-medium">
          {notGenerated ? "아직 Brand Brief가 없습니다" : "Brand Brief를 불러오지 못했습니다"}
        </h1>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isGenerating && <Spinner />}
          Brand Brief 생성하기
        </button>
        {generateError && <p className="text-sm text-red-600">{generateError}</p>}
        <Link href={`/projects/${projectId}`} className="text-sm underline">
          프로젝트로 돌아가기
        </Link>
      </main>
    );
  }

  const { brief, versions } = data;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Brand Brief</h1>
          <p className="text-xs text-neutral-400">
            v{brief.currentVersion.versionNumber} ·{" "}
            {brief.currentVersion.source === "ai" ? "AI 생성" : "사용자 수정"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/projects/${projectId}`} className="text-sm underline">
            프로젝트로
          </Link>
          {isEditing ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className="flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              {saveStatus === "saving" && <Spinner />}
              저장
            </button>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            >
              편집
            </button>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {isGenerating ? "재생성 중..." : "AI 재생성"}
          </button>
        </div>
      </header>

      {saveStatus === "saved" && <p className="text-xs text-green-600">저장되었습니다.</p>}
      {saveStatus === "error" && <p className="text-xs text-red-600">저장에 실패했습니다.</p>}

      {(() => {
        const display = isEditing && form ? form : brief.currentVersion.data;
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            {TEXT_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-neutral-500">{label}</label>
                {isEditing && form ? (
                  <textarea
                    value={form[key] as string}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    rows={2}
                    className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
                  />
                ) : (
                  <p className="text-sm">{(display[key] as string) || "—"}</p>
                )}
              </div>
            ))}

            {LIST_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-neutral-500">{label}</label>
                {isEditing && form ? (
                  <input
                    type="text"
                    value={form[key].join(", ")}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [key]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
                  />
                ) : (
                  <p className="text-sm">{display[key].length > 0 ? display[key].join(", ") : "—"}</p>
                )}
              </div>
            ))}
          </div>
        );
      })()}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-700">버전 기록</h2>
        <ul className="flex flex-col gap-1">
          {versions.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm"
            >
              <span>
                v{v.versionNumber} · {v.source === "ai" ? "AI 생성" : "사용자 수정"} ·{" "}
                {new Date(v.createdAt).toLocaleString("ko-KR")}
              </span>
              {v.versionNumber !== brief.currentVersion.versionNumber && (
                <button
                  type="button"
                  onClick={() => handleRestore(v.versionNumber)}
                  className="text-xs underline"
                >
                  이 버전으로 복원
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
