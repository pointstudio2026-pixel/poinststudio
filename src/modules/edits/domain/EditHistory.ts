import type { GenerationStatus, GenerationVersion } from "@/modules/generations/domain/Generation";
import type { EditPresetKey } from "@/modules/edits/domain/EditPresets";

export interface EditHistoryEntry {
  id: string;
  generationId: string;
  sourceVersionId: string;
  sourceImageIndex: number;
  presetKey: EditPresetKey;
  resultVersionId: string;
  status: GenerationStatus;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface EditHistoryEntryWithResult extends EditHistoryEntry {
  resultVersion: GenerationVersion | null;
}
