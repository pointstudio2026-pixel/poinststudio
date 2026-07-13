"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchConceptBoard,
  generateConceptBoard,
  restoreConceptBoardVersion,
  updateConceptBoard,
  type ConceptBoardDataDto,
  type ConceptBoardSectionKeyDto,
} from "@/services/concept-board-service";
import { Spinner } from "@/components/Spinner";

const SECTION_LABELS: Record<ConceptBoardSectionKeyDto, string> = {
  hero_image: "Hero Image",
  brand_summary: "Brand Summary",
  core_values: "Core Values",
  style_keywords: "Style Keywords",
  color_palette: "Color Palette",
  typography_direction: "Typography Direction",
  logo_concepts: "Logo Concepts",
  design_notes: "Design Notes",
};

export function ConceptBoardView({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["concept-board", projectId],
    queryFn: () => fetchConceptBoard(projectId),
    retry: false,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"brandSummary" | "designNotes" | "typographyDirection" | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  const [showVersions, setShowVersions] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      await generateConceptBoard(projectId);
      await queryClient.invalidateQueries({ queryKey: ["concept-board", projectId] });
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Concept Board 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function savePatch(patch: Partial<ConceptBoardDataDto>) {
    await updateConceptBoard(projectId, patch);
    await queryClient.invalidateQueries({ queryKey: ["concept-board", projectId] });
  }

  function startEditingField(field: typeof editingField, current: string) {
    setEditingField(field);
    setDraft(current);
  }

  async function saveField() {
    if (!editingField) return;
    await savePatch({ [editingField]: draft });
    setEditingField(null);
  }

  async function moveSection(sectionOrder: ConceptBoardSectionKeyDto[], index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sectionOrder.length) return;
    const reordered = [...sectionOrder];
    [reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!];
    await savePatch({ sectionOrder: reordered });
  }

  async function handleRestore(versionNumber: number) {
    await restoreConceptBoardVersion(projectId, versionNumber);
    await queryClient.invalidateQueries({ queryKey: ["concept-board", projectId] });
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
          {notGenerated ? "아직 Concept Board가 없습니다" : "Concept Board를 불러오지 못했습니다"}
        </h1>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isGenerating && <Spinner />}
          Concept Board 생성하기
        </button>
        {generateError && <p className="text-sm text-red-600">{generateError}</p>}
        <Link href={`/projects/${projectId}`} className="text-sm underline">
          프로젝트로 돌아가기
        </Link>
      </main>
    );
  }

  const { board, versions } = data;
  const d = board.currentVersion.data;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Concept Board</h1>
          <p className="text-xs text-neutral-400">
            v{board.currentVersion.versionNumber} · {board.currentVersion.source === "ai" ? "AI 생성" : "사용자 수정"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/projects/${projectId}`} className="text-sm underline">
            프로젝트로
          </Link>
          <button
            type="button"
            onClick={() => setShowVersions(!showVersions)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            버전 기록
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {isGenerating ? "재생성 중..." : "다시 생성"}
          </button>
        </div>
      </header>

      {generateError && <p className="text-sm text-red-600">{generateError}</p>}

      {showVersions && (
        <section className="flex flex-col gap-2 rounded-md border border-neutral-200 p-4">
          <h2 className="text-sm font-medium text-neutral-700">버전 타임라인</h2>
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
                {v.versionNumber !== board.currentVersion.versionNumber && (
                  <button type="button" onClick={() => handleRestore(v.versionNumber)} className="text-xs underline">
                    이 버전으로 복원
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-4">
        {d.sectionOrder.map((section, index) => (
          <section key={section} className="rounded-md border border-neutral-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-700">{SECTION_LABELS[section]}</h2>
              <div className="flex gap-1 text-xs text-neutral-400">
                <button
                  type="button"
                  onClick={() => moveSection(d.sectionOrder, index, -1)}
                  disabled={index === 0}
                  className="disabled:opacity-30"
                  aria-label="위로 이동"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(d.sectionOrder, index, 1)}
                  disabled={index === d.sectionOrder.length - 1}
                  className="disabled:opacity-30"
                  aria-label="아래로 이동"
                >
                  ▼
                </button>
              </div>
            </div>

            {section === "hero_image" &&
              (d.heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.heroImageUrl} alt="Hero" className="aspect-video w-full rounded-md object-cover" />
              ) : (
                <p className="text-sm text-neutral-400">아직 생성된 이미지가 없습니다.</p>
              ))}

            {section === "brand_summary" &&
              (editingField === "brandSummary" ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    className="rounded-md border border-neutral-300 p-2 text-sm"
                  />
                  <button type="button" onClick={saveField} className="self-start rounded-md bg-neutral-900 px-3 py-1 text-xs text-white">
                    저장
                  </button>
                </div>
              ) : (
                <p
                  onClick={() => startEditingField("brandSummary", d.brandSummary)}
                  className="cursor-text text-sm"
                >
                  {d.brandSummary}
                </p>
              ))}

            {section === "core_values" && (
              <p className="text-sm">{d.coreValues.length > 0 ? d.coreValues.join(", ") : "—"}</p>
            )}

            {section === "style_keywords" && (
              <p className="text-sm">{d.styleKeywords.length > 0 ? d.styleKeywords.join(", ") : "—"}</p>
            )}

            {section === "color_palette" && (
              <div className="flex gap-3">
                {d.colorPalette.map((swatch) => (
                  <div key={swatch.hex} className="flex flex-col items-center gap-1">
                    <div
                      className="h-12 w-12 rounded-md border border-neutral-200"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <span className="text-[10px] text-neutral-500">{swatch.label}</span>
                  </div>
                ))}
              </div>
            )}

            {section === "typography_direction" &&
              (editingField === "typographyDirection" ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                    className="rounded-md border border-neutral-300 p-2 text-sm"
                  />
                  <button type="button" onClick={saveField} className="self-start rounded-md bg-neutral-900 px-3 py-1 text-xs text-white">
                    저장
                  </button>
                </div>
              ) : (
                <p onClick={() => startEditingField("typographyDirection", d.typographyDirection)} className="cursor-text text-sm">
                  {d.typographyDirection}
                </p>
              ))}

            {section === "logo_concepts" && (
              <div className="grid grid-cols-3 gap-2">
                {d.logoConceptImageUrls.length > 0 ? (
                  d.logoConceptImageUrls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt={`Logo concept ${i + 1}`} className="aspect-square w-full rounded-md object-cover" />
                  ))
                ) : (
                  <p className="text-sm text-neutral-400">아직 생성된 이미지가 없습니다.</p>
                )}
              </div>
            )}

            {section === "design_notes" &&
              (editingField === "designNotes" ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    className="rounded-md border border-neutral-300 p-2 text-sm"
                  />
                  <button type="button" onClick={saveField} className="self-start rounded-md bg-neutral-900 px-3 py-1 text-xs text-white">
                    저장
                  </button>
                </div>
              ) : (
                <p onClick={() => startEditingField("designNotes", d.designNotes)} className="cursor-text text-sm text-neutral-600">
                  {d.designNotes || "클릭하여 메모를 추가하세요."}
                </p>
              ))}
          </section>
        ))}
      </div>
    </main>
  );
}
