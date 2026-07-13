import { prisma } from "@/shared/database/prisma";
import type { ExportFormat, ExportJob, ExportSource } from "@/modules/exports/domain/Export";
import type { ConceptBoardSectionKey } from "@/modules/conceptBoards/domain/ConceptBoard";
import type {
  CreateExportInput,
  ExportRepository,
  UpdateExportResultInput,
} from "@/modules/exports/domain/ExportRepository";
import type { GenerationStatus } from "@/modules/generations/domain/Generation";

function toJob(row: {
  id: string;
  projectId: string;
  source: string;
  format: string;
  sourceRefId: string | null;
  sections: string[];
  includeBrandInfo: boolean;
  status: string;
  fileKey: string | null;
  fileSizeBytes: number | null;
  watermarked: boolean;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}): ExportJob {
  return {
    id: row.id,
    projectId: row.projectId,
    source: row.source as ExportSource,
    format: row.format as ExportFormat,
    sourceRefId: row.sourceRefId,
    sections: row.sections as ConceptBoardSectionKey[],
    includeBrandInfo: row.includeBrandInfo,
    status: row.status as GenerationStatus,
    fileKey: row.fileKey,
    fileSizeBytes: row.fileSizeBytes,
    watermarked: row.watermarked,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
  };
}

export class PrismaExportRepository implements ExportRepository {
  async create(input: CreateExportInput): Promise<ExportJob> {
    const row = await prisma.exportJob.create({
      data: {
        projectId: input.projectId,
        source: input.source,
        format: input.format,
        sourceRefId: input.sourceRefId,
        sections: input.sections,
        includeBrandInfo: input.includeBrandInfo,
        watermarked: input.watermarked,
        status: "pending",
      },
    });
    return toJob(row);
  }

  async getById(id: string): Promise<ExportJob | null> {
    const row = await prisma.exportJob.findUnique({ where: { id } });
    return row ? toJob(row) : null;
  }

  async updateResult(id: string, patch: UpdateExportResultInput): Promise<ExportJob> {
    const row = await prisma.exportJob.update({
      where: { id },
      data: {
        status: patch.status,
        ...(patch.fileKey !== undefined ? { fileKey: patch.fileKey } : {}),
        ...(patch.fileSizeBytes !== undefined ? { fileSizeBytes: patch.fileSizeBytes } : {}),
        ...(patch.errorMessage !== undefined ? { errorMessage: patch.errorMessage } : {}),
        ...(patch.completedAt !== undefined ? { completedAt: patch.completedAt } : {}),
      },
    });
    return toJob(row);
  }

  async listByProjectId(projectId: string): Promise<ExportJob[]> {
    const rows = await prisma.exportJob.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toJob);
  }
}
