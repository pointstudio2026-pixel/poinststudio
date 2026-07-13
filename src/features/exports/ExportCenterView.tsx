"use client";

import { useState } from "react";
import Link from "next/link";
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

const SOURCE_LABELS: Record<ExportSourceDto, string> = {
  concept_board: "Concept Board (PDF)",
  generation: "Generation 이미지",
  mockup: "Mockup 이미지",
};

export function ExportCenterView({ projectId }: { projectId: string }) {
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
      setActionError(err instanceof Error ? err.message : "Export 요청에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    source === "concept_board" ? Boolean(boardData?.board) && sections.length > 0 : Boolean(sourceRefId);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Export Center</h1>
        <Link href={`/projects/${projectId}`} className="text-sm underline">
          프로젝트로
        </Link>
      </header>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">새 Export</h2>

        <div className="mt-2 flex gap-2">
          {(Object.keys(SOURCE_LABELS) as ExportSourceDto[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSourceChange(key)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                source === key ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"
              }`}
            >
              {SOURCE_LABELS[key]}
            </button>
          ))}
        </div>

        {source === "concept_board" && (
          <div className="mt-3">
            <p className="text-xs font-medium text-neutral-500">포함할 섹션</p>
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
              브랜드 텍스트 정보 포함 (요약/핵심가치/메모)
            </label>
            {!boardData?.board && (
              <p className="mt-2 text-xs text-neutral-400">Concept Board가 아직 생성되지 않았습니다.</p>
            )}
          </div>
        )}

        {source === "generation" && (
          <div className="mt-3">
            <p className="text-xs font-medium text-neutral-500">이미지 선택</p>
            <div className="mt-1 flex gap-2">
              {(generationData?.generation.currentVersion.images ?? []).map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSourceRefId(generationData!.generation.currentVersion.id)}
                  className={`h-16 w-16 overflow-hidden rounded-md border ${
                    sourceRefId ? "border-neutral-900 ring-2 ring-neutral-900" : "border-neutral-200"
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
            <p className="text-xs font-medium text-neutral-500">목업 선택</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {(mockupsData?.mockups ?? [])
                .filter((m) => m.status === "completed")
                .map((mockup) => (
                  <button
                    key={mockup.id}
                    type="button"
                    onClick={() => setSourceRefId(mockup.id)}
                    className={`h-16 w-16 overflow-hidden rounded-md border ${
                      sourceRefId === mockup.id ? "border-neutral-900 ring-2 ring-neutral-900" : "border-neutral-200"
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
          className="mt-4 flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isSubmitting && <Spinner />}
          Export 시작
        </button>
        {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-700">다운로드 센터</h2>
        <ul className="flex flex-col gap-2">
          {(exportsData?.exports ?? []).map((job) => (
            <li
              key={job.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm"
            >
              <span>
                {SOURCE_LABELS[job.source]} · {job.format.toUpperCase()} · {job.status}
                {job.watermarked && <span className="ml-1 text-xs text-amber-600">(워터마크)</span>}
                <span className="ml-2 text-xs text-neutral-400">
                  {new Date(job.createdAt).toLocaleString("ko-KR")}
                </span>
              </span>
              {job.status === "completed" ? (
                <a href={downloadExportUrl(job.id)} className="text-xs underline">
                  다운로드
                </a>
              ) : job.status === "failed" ? (
                <span className="text-xs text-red-600">실패: {job.errorMessage}</span>
              ) : (
                <Spinner />
              )}
            </li>
          ))}
          {exportsData?.exports.length === 0 && (
            <li className="text-sm text-neutral-400">아직 Export 이력이 없습니다.</li>
          )}
        </ul>
      </section>
    </main>
  );
}
