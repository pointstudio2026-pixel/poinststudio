import type { GenerationStatus } from "@/modules/generations/domain/Generation";
import type { ConceptBoardSectionKey } from "@/modules/conceptBoards/domain/ConceptBoard";

export type ExportSource = "concept_board" | "mockup" | "generation";
export type ExportFormat = "pdf" | "png" | "jpg";

export const VALID_FORMATS_BY_SOURCE: Record<ExportSource, ExportFormat[]> = {
  concept_board: ["pdf"],
  mockup: ["png", "jpg"],
  generation: ["png", "jpg"],
};

export interface ExportJob {
  id: string;
  projectId: string;
  source: ExportSource;
  format: ExportFormat;
  sourceRefId: string | null;
  sections: ConceptBoardSectionKey[];
  includeBrandInfo: boolean;
  status: GenerationStatus;
  fileKey: string | null;
  fileSizeBytes: number | null;
  watermarked: boolean;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}
