import type { EditHistoryEntry } from "@/modules/edits/domain/EditHistory";
import type { EditPresetKey } from "@/modules/edits/domain/EditPresets";
import type { GenerationStatus } from "@/modules/generations/domain/Generation";

export interface CreateEditHistoryInput {
  generationId: string;
  sourceVersionId: string;
  sourceImageIndex: number;
  presetKey: EditPresetKey;
  resultVersionId: string;
}

export interface UpdateEditHistoryInput {
  status: GenerationStatus;
  errorMessage?: string | null;
  completedAt?: Date;
}

export interface EditHistoryRepository {
  create(input: CreateEditHistoryInput): Promise<EditHistoryEntry>;
  getById(editId: string): Promise<EditHistoryEntry | null>;
  update(editId: string, patch: UpdateEditHistoryInput): Promise<EditHistoryEntry>;
  listByGenerationId(generationId: string): Promise<EditHistoryEntry[]>;
}
