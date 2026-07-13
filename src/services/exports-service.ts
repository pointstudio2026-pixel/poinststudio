import { apiFetch } from "@/services/http-client";
import type { ConceptBoardSectionKeyDto } from "@/services/concept-board-service";

export type ExportSourceDto = "concept_board" | "mockup" | "generation";
export type ExportFormatDto = "pdf" | "png" | "jpg";

export interface ExportJobDto {
  id: string;
  projectId: string;
  source: ExportSourceDto;
  format: ExportFormatDto;
  sourceRefId: string | null;
  sections: ConceptBoardSectionKeyDto[];
  includeBrandInfo: boolean;
  status: "pending" | "processing" | "completed" | "failed";
  fileKey: string | null;
  fileSizeBytes: number | null;
  watermarked: boolean;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export function createExport(input: {
  projectId: string;
  source: ExportSourceDto;
  format: ExportFormatDto;
  sourceRefId?: string;
  sections?: ConceptBoardSectionKeyDto[];
  includeBrandInfo?: boolean;
}) {
  return apiFetch<{ export: ExportJobDto }>("/api/exports", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchExports(projectId: string) {
  return apiFetch<{ exports: ExportJobDto[] }>(`/api/exports/${projectId}`);
}

export function fetchExportStatus(exportId: string) {
  return apiFetch<{ export: ExportJobDto }>(`/api/exports/status/${exportId}`);
}

export function downloadExportUrl(exportId: string) {
  return `/api/exports/download/${exportId}`;
}
