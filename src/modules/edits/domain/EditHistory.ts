import type { GenerationStatus, GenerationVersion } from "@/modules/generations/domain/Generation";
import type { EditPresetKey } from "@/modules/edits/domain/EditPresets";

export interface EditHistoryEntry {
  id: string;
  generationId: string;
  sourceVersionId: string;
  sourceImageIndex: number;
  presetKey: EditPresetKey | null;
  /** 프리셋 대신 사용자가 대화형으로 직접 입력한 수정 지시. presetKey와 정확히 하나만 채워진다. */
  customInstruction: string | null;
  resultVersionId: string;
  status: GenerationStatus;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface EditHistoryEntryWithResult extends EditHistoryEntry {
  resultVersion: GenerationVersion | null;
}
