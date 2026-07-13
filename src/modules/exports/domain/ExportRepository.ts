import type { ExportFormat, ExportJob, ExportSource } from "@/modules/exports/domain/Export";
import type { ConceptBoardSectionKey } from "@/modules/conceptBoards/domain/ConceptBoard";
import type { GenerationStatus } from "@/modules/generations/domain/Generation";

export interface CreateExportInput {
  projectId: string;
  source: ExportSource;
  format: ExportFormat;
  sourceRefId: string | null;
  sections: ConceptBoardSectionKey[];
  includeBrandInfo: boolean;
  watermarked: boolean;
}

export interface UpdateExportResultInput {
  status: GenerationStatus;
  fileKey?: string;
  fileSizeBytes?: number;
  errorMessage?: string | null;
  completedAt?: Date;
}

export interface ExportRepository {
  create(input: CreateExportInput): Promise<ExportJob>;
  getById(id: string): Promise<ExportJob | null>;
  updateResult(id: string, patch: UpdateExportResultInput): Promise<ExportJob>;
  listByProjectId(projectId: string): Promise<ExportJob[]>;
}
