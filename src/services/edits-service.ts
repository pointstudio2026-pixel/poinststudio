import { apiFetch } from "@/services/http-client";
import type { GenerationStatusDto } from "@/services/generations-service";

export type EditPresetKeyDto =
  | "simpler"
  | "more_luxurious"
  | "more_minimal"
  | "more_dynamic"
  | "change_color"
  | "emphasize_typography"
  | "icon_only"
  | "symbol_only"
  | "layout_change"
  | "regenerate";

export const EDIT_PRESET_OPTIONS: { key: EditPresetKeyDto; label: string }[] = [
  { key: "simpler", label: "심플하게" },
  { key: "more_luxurious", label: "더 고급스럽게" },
  { key: "more_minimal", label: "더 미니멀하게" },
  { key: "more_dynamic", label: "더 역동적으로" },
  { key: "change_color", label: "컬러 변경" },
  { key: "emphasize_typography", label: "타이포 강조" },
  { key: "icon_only", label: "아이콘만 수정" },
  { key: "symbol_only", label: "심볼만 수정" },
  { key: "layout_change", label: "레이아웃 변경" },
  { key: "regenerate", label: "다시 생성" },
];

export interface EditHistoryEntryDto {
  id: string;
  generationId: string;
  sourceVersionId: string;
  sourceImageIndex: number;
  presetKey: EditPresetKeyDto;
  resultVersionId: string;
  status: GenerationStatusDto;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  resultVersion: { images: { url: string; thumbnailUrl: string }[] } | null;
}

export function createEdit(
  projectId: string,
  sourceVersionId: string,
  sourceImageIndex: number,
  presetKey: EditPresetKeyDto,
) {
  return apiFetch<{ edit: EditHistoryEntryDto }>("/api/edits", {
    method: "POST",
    body: JSON.stringify({ projectId, sourceVersionId, sourceImageIndex, presetKey }),
  });
}

export function fetchEditHistory(generationId: string) {
  return apiFetch<{ history: EditHistoryEntryDto[] }>(`/api/edits/${generationId}`);
}

export function retryEdit(editHistoryId: string) {
  return apiFetch<{ edit: EditHistoryEntryDto }>(`/api/edits/${editHistoryId}/retry`, {
    method: "POST",
  });
}
