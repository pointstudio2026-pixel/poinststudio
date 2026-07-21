import { prisma } from "@/shared/database/prisma";
import type { EditHistoryEntry } from "@/modules/edits/domain/EditHistory";
import type { EditPresetKey } from "@/modules/edits/domain/EditPresets";
import type {
  CreateEditHistoryInput,
  EditHistoryRepository,
  UpdateEditHistoryInput,
} from "@/modules/edits/domain/EditHistoryRepository";
import type { GenerationStatus } from "@/modules/generations/domain/Generation";

function toEntry(row: {
  id: string;
  generationId: string;
  sourceVersionId: string;
  sourceImageIndex: number;
  presetKey: string | null;
  customInstruction: string | null;
  resultVersionId: string;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}): EditHistoryEntry {
  return {
    id: row.id,
    generationId: row.generationId,
    sourceVersionId: row.sourceVersionId,
    sourceImageIndex: row.sourceImageIndex,
    presetKey: row.presetKey as EditPresetKey | null,
    customInstruction: row.customInstruction,
    resultVersionId: row.resultVersionId,
    status: row.status as GenerationStatus,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
  };
}

export class PrismaEditHistoryRepository implements EditHistoryRepository {
  async create(input: CreateEditHistoryInput): Promise<EditHistoryEntry> {
    const row = await prisma.editHistory.create({
      data: {
        generationId: input.generationId,
        sourceVersionId: input.sourceVersionId,
        sourceImageIndex: input.sourceImageIndex,
        presetKey: input.presetKey,
        customInstruction: input.customInstruction,
        resultVersionId: input.resultVersionId,
        status: "pending",
      },
    });
    return toEntry(row);
  }

  async getById(editId: string): Promise<EditHistoryEntry | null> {
    const row = await prisma.editHistory.findUnique({ where: { id: editId } });
    return row ? toEntry(row) : null;
  }

  async update(editId: string, patch: UpdateEditHistoryInput): Promise<EditHistoryEntry> {
    const row = await prisma.editHistory.update({
      where: { id: editId },
      data: {
        status: patch.status,
        ...(patch.errorMessage !== undefined ? { errorMessage: patch.errorMessage } : {}),
        ...(patch.completedAt !== undefined ? { completedAt: patch.completedAt } : {}),
      },
    });
    return toEntry(row);
  }

  async listByGenerationId(generationId: string): Promise<EditHistoryEntry[]> {
    const rows = await prisma.editHistory.findMany({
      where: { generationId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toEntry);
  }
}
