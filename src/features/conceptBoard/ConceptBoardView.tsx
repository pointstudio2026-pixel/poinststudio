"use client";

import { useState } from "react";
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
import { ImageLightbox } from "@/components/ImageLightbox";
import { NextStepButton } from "@/features/workspace/NextStepButton";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";

// dominantColorExtractor.ts는 지배색 스와치 라벨을 "주요 색상 {n}"(한국어
// 고정 문자열)로 저장한다 -- 이 값 저장 시점엔 요청자의 locale을 알 수 없는
// 인프라 계층(sharp 픽셀 연산)이라, "translate at render, not at storage"
// 컨벤션을 따라 저장은 그대로 두고 화면에 보여줄 때만 여기서 파싱해 번역한다.
// COLOR_KEYWORD_RULES/DEFAULT_SWATCHES가 만드는 라벨("Warm Terracotta" 등)은
// 이미 영어 고정 라벨이라 이 패턴에 안 걸리므로 그대로 노출된다(범위 밖).
const DOMINANT_COLOR_LABEL_PATTERN = /^주요 색상 (\d+)$/;

function colorSwatchLabel(
  label: string,
  t: (key: MessageKey, params?: Record<string, string | number>) => string,
): string {
  const match = DOMINANT_COLOR_LABEL_PATTERN.exec(label);
  return match ? t("conceptBoard.dominantColorLabel", { n: match[1]! }) : label;
}

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
  const { t } = useTranslation();
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
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      await generateConceptBoard(projectId);
      await queryClient.invalidateQueries({ queryKey: ["concept-board", projectId] });
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : t("conceptBoard.generateFailed"));
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
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    const notGenerated = error instanceof Error && error.message.includes("생성되지 않았");
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-lg font-medium">
          {notGenerated ? t("conceptBoard.notGeneratedTitle") : t("conceptBoard.loadFailedTitle")}
        </h1>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50"
        >
          {isGenerating && <Spinner />}
          {t("conceptBoard.generateButton")}
        </button>
        {generateError && <p className="text-sm text-red-600">{generateError}</p>}
      </div>
    );
  }

  const { board, versions } = data;
  const d = board.currentVersion.data;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t("conceptBoard.title")}</h1>
          <p className="text-xs text-muted">
            v{board.currentVersion.versionNumber} · {board.currentVersion.source === "ai" ? t("conceptBoard.sourceAi") : t("conceptBoard.sourceUser")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowVersions(!showVersions)}
            className="rounded-full border border-line px-3 py-1.5 text-sm"
          >
            {t("conceptBoard.versionHistory")}
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-full border border-line px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {isGenerating ? t("conceptBoard.regenerating") : t("conceptBoard.regenerate")}
          </button>
          <NextStepButton projectId={projectId} currentStepKey="concept_board" />
        </div>
      </header>

      {generateError && <p className="text-sm text-red-600">{generateError}</p>}

      {showVersions && (
        <section className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <h2 className="text-sm font-medium text-ink">{t("conceptBoard.versionTimeline")}</h2>
          <ul className="flex flex-col gap-1">
            {versions.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm"
              >
                <span>
                  v{v.versionNumber} · {v.source === "ai" ? t("conceptBoard.sourceAi") : t("conceptBoard.sourceUser")} ·{" "}
                  {new Date(v.createdAt).toLocaleString("ko-KR")}
                </span>
                {v.versionNumber !== board.currentVersion.versionNumber && (
                  <button type="button" onClick={() => handleRestore(v.versionNumber)} className="text-xs underline">
                    {t("conceptBoard.restoreVersion")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-4">
        {d.sectionOrder.map((section, index) => (
          <section key={section} className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">{SECTION_LABELS[section]}</h2>
              <div className="flex gap-1 text-xs text-muted">
                <button
                  type="button"
                  onClick={() => moveSection(d.sectionOrder, index, -1)}
                  disabled={index === 0}
                  className="disabled:opacity-30"
                  aria-label={t("conceptBoard.moveUp")}
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(d.sectionOrder, index, 1)}
                  disabled={index === d.sectionOrder.length - 1}
                  className="disabled:opacity-30"
                  aria-label={t("conceptBoard.moveDown")}
                >
                  ▼
                </button>
              </div>
            </div>

            {section === "hero_image" &&
              (d.heroImageUrl ? (
                <div
                  onClick={() => setLightboxImage({ url: d.heroImageUrl!, alt: "Hero" })}
                  className="w-full cursor-pointer overflow-hidden rounded-2xl"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.heroImageUrl} alt="Hero" className="block h-auto w-full" />
                </div>
              ) : (
                <p className="text-sm text-muted">{t("conceptBoard.noImagesYet")}</p>
              ))}

            {section === "brand_summary" &&
              (editingField === "brandSummary" ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    className="rounded-xl border border-line p-2 text-sm"
                  />
                  <button type="button" onClick={saveField} className="self-start rounded-full bg-ink px-3 py-1 text-xs text-paper">
                    {t("conceptBoard.save")}
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
              <div className="flex flex-wrap gap-3">
                {d.colorPalette.map((swatch) => (
                  <div key={swatch.hex} className="flex flex-col items-center gap-1">
                    <div
                      className="h-12 w-12 rounded-xl border border-line"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <span className="text-[10px] text-muted">{colorSwatchLabel(swatch.label, t)}</span>
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
                    className="rounded-xl border border-line p-2 text-sm"
                  />
                  <button type="button" onClick={saveField} className="self-start rounded-full bg-ink px-3 py-1 text-xs text-paper">
                    {t("conceptBoard.save")}
                  </button>
                </div>
              ) : (
                <p onClick={() => startEditingField("typographyDirection", d.typographyDirection)} className="cursor-text text-sm">
                  {d.typographyDirection}
                </p>
              ))}

            {section === "logo_concepts" && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {d.logoConceptImageUrls.length > 0 ? (
                  d.logoConceptImageUrls.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setLightboxImage({ url, alt: `Logo concept ${i + 1}` })}
                      className="w-full cursor-pointer overflow-hidden rounded-xl"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Logo concept ${i + 1}`} className="block h-auto w-full" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">{t("conceptBoard.noImagesYet")}</p>
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
                    className="rounded-xl border border-line p-2 text-sm"
                  />
                  <button type="button" onClick={saveField} className="self-start rounded-full bg-ink px-3 py-1 text-xs text-paper">
                    {t("conceptBoard.save")}
                  </button>
                </div>
              ) : (
                <p onClick={() => startEditingField("designNotes", d.designNotes)} className="cursor-text text-sm text-muted">
                  {d.designNotes || t("conceptBoard.addNotePrompt")}
                </p>
              ))}
          </section>
        ))}
      </div>

      {lightboxImage && (
        <ImageLightbox src={lightboxImage.url} alt={lightboxImage.alt} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
}
