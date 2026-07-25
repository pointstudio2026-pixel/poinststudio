"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createExport,
  downloadExportUrl,
  fetchExports,
  type ExportFormatDto,
  type ExportSourceDto,
} from "@/services/exports-service";
import { fetchConceptBoard } from "@/services/concept-board-service";
import { fetchGenerationHistory } from "@/services/generations-service";
import { fetchMockups } from "@/services/mockups-service";
import { CONCEPT_BOARD_SECTIONS } from "@/modules/conceptBoards/domain/ConceptBoard";
import type { ConceptBoardSectionKeyDto } from "@/services/concept-board-service";
import { Spinner } from "@/components/Spinner";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";

const SOURCE_LABEL_KEYS: Record<ExportSourceDto, MessageKey> = {
  concept_board: "exportCenter.sourceConceptBoard",
  generation: "exportCenter.sourceGeneration",
  mockup: "exportCenter.sourceMockup",
};

export function ExportCenterView({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [source, setSource] = useState<ExportSourceDto>("concept_board");
  const [format, setFormat] = useState<ExportFormatDto>("pdf");
  const [sourceRefId, setSourceRefId] = useState<string>("");
  const [sections, setSections] = useState<ConceptBoardSectionKeyDto[]>([...CONCEPT_BOARD_SECTIONS]);
  const [includeBrandInfo, setIncludeBrandInfo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: boardData } = useQuery({
    queryKey: ["concept-board", projectId],
    queryFn: () => fetchConceptBoard(projectId),
    retry: false,
    enabled: source === "concept_board",
  });
  const { data: generationData } = useQuery({
    queryKey: ["generation-history", projectId],
    queryFn: () => fetchGenerationHistory(projectId),
    retry: false,
    enabled: source === "generation",
  });
  const { data: mockupsData } = useQuery({
    queryKey: ["mockups", projectId, ""],
    queryFn: () => fetchMockups(projectId),
    enabled: source === "mockup",
  });

  const { data: exportsData } = useQuery({
    queryKey: ["exports", projectId],
    queryFn: () => fetchExports(projectId),
    refetchInterval: (query) => {
      const hasInFlight = query.state.data?.exports.some((e) => e.status === "pending" || e.status === "processing");
      return hasInFlight ? 1500 : false;
    },
  });

  function handleSourceChange(next: ExportSourceDto) {
    setSource(next);
    setFormat(next === "concept_board" ? "pdf" : "png");
    setSourceRefId("");
  }

  function toggleSection(section: ConceptBoardSectionKeyDto) {
    setSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await createExport({
        projectId,
        source,
        format,
        sourceRefId: source === "concept_board" ? undefined : sourceRefId || undefined,
        sections: source === "concept_board" ? sections : undefined,
        includeBrandInfo,
      });
      await queryClient.invalidateQueries({ queryKey: ["exports", projectId] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("exportCenter.requestFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    source === "concept_board" ? Boolean(boardData?.board) && sections.length > 0 : Boolean(sourceRefId);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold">{t("workspaceSteps.exportCenter")}</h1>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <h2 className="text-sm font-medium text-ink">{t("exportCenter.newExport")}</h2>

        <div className="mt-2 flex gap-2">
          {(Object.keys(SOURCE_LABEL_KEYS) as ExportSourceDto[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSourceChange(key)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                source === key ? "border-ink bg-ink text-paper" : "border-line"
              }`}
            >
              {t(SOURCE_LABEL_KEYS[key])}
            </button>
          ))}
        </div>

        {source === "concept_board" && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted">{t("exportCenter.sectionsToInclude")}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {CONCEPT_BOARD_SECTIONS.map((section) => (
                <label key={section} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={sections.includes(section)}
                    onChange={() => toggleSection(section)}
                  />
                  {section}
                </label>
              ))}
            </div>
            <label className="mt-2 flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={includeBrandInfo}
                onChange={(e) => setIncludeBrandInfo(e.target.checked)}
              />
              {t("exportCenter.includeBrandInfo")}
            </label>
            {!boardData?.board && (
              <p className="mt-2 text-xs text-muted">{t("exportCenter.conceptBoardNotGenerated")}</p>
            )}
          </div>
        )}

        {source === "generation" && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted">{t("exportCenter.selectImage")}</p>
            <div className="mt-1 flex gap-2">
              {(generationData?.generation.currentVersion.images ?? []).map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSourceRefId(generationData!.generation.currentVersion.id)}
                  className={`h-16 w-16 overflow-hidden rounded-xl border ${
                    sourceRefId ? "border-ink ring-2 ring-ink" : "border-line"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.thumbnailUrl} alt={`Concept ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <button type="button" onClick={() => setFormat("png")} className={format === "png" ? "underline" : ""}>
                PNG
              </button>
              <button type="button" onClick={() => setFormat("jpg")} className={format === "jpg" ? "underline" : ""}>
                JPG
              </button>
            </div>
          </div>
        )}

        {source === "mockup" && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted">{t("exportCenter.selectMockup")}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {(mockupsData?.mockups ?? [])
                .filter((m) => m.status === "completed")
                .map((mockup) => (
                  <button
                    key={mockup.id}
                    type="button"
                    onClick={() => setSourceRefId(mockup.id)}
                    className={`h-16 w-16 overflow-hidden rounded-xl border ${
                      sourceRefId === mockup.id ? "border-ink ring-2 ring-ink" : "border-line"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mockup.thumbnailUrl ?? mockup.resultImageUrl ?? ""}
                      alt="Mockup"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <button type="button" onClick={() => setFormat("png")} className={format === "png" ? "underline" : ""}>
                PNG
              </button>
              <button type="button" onClick={() => setFormat("jpg")} className={format === "jpg" ? "underline" : ""}>
                JPG
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="mt-4 flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50"
        >
          {isSubmitting && <Spinner />}
          {t("exportCenter.startExport")}
        </button>
        {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink">{t("exportCenter.downloadCenter")}</h2>
        <ul className="flex flex-col gap-2">
          {(exportsData?.exports ?? []).map((job) => (
            <li
              key={job.id}
              className="flex items-center justify-between rounded-2xl border border-line px-3 py-2 text-sm"
            >
              <span>
                {t(SOURCE_LABEL_KEYS[job.source])} · {job.format.toUpperCase()} · {job.status}
                {job.watermarked && <span className="ml-1 text-xs text-amber-600">{t("exportCenter.watermarked")}</span>}
                <span className="ml-2 text-xs text-muted">
                  {new Date(job.createdAt).toLocaleString("ko-KR")}
                </span>
              </span>
              {job.status === "completed" ? (
                <a href={downloadExportUrl(job.id)} className="text-xs underline">
                  {t("exportCenter.download")}
                </a>
              ) : job.status === "failed" ? (
                <span className="text-xs text-red-600">{t("exportCenter.failedWithMessage", { message: job.errorMessage ?? "" })}</span>
              ) : (
                <Spinner />
              )}
            </li>
          ))}
          {exportsData?.exports.length === 0 && (
            <li className="text-sm text-muted">{t("exportCenter.noExportsYet")}</li>
          )}
        </ul>
      </section>
    </div>
  );
}
