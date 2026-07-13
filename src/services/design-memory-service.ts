import { apiFetch } from "@/services/http-client";
import type { StyleDto } from "@/services/styles-service";
import type { EditPresetKeyDto } from "@/services/edits-service";
import type { MockupCategoryDto } from "@/services/mockups-service";

export interface DesignMemorySettingsDto {
  userId: string;
  enabled: boolean;
  resetAt: string | null;
}

export interface TextSignalDto {
  value: string;
  count: number;
}

export interface StyleSignalDto {
  style: StyleDto;
  count: number;
  reason: string;
}

export interface EditPresetSignalDto {
  presetKey: EditPresetKeyDto;
  label: string;
  count: number;
  reason: string;
}

export interface MockupCategorySignalDto {
  category: MockupCategoryDto;
  count: number;
  reason: string;
}

export interface DesignMemoryProfileDto {
  enabled: boolean;
  resetAt: string | null;
  signalCount: number;
  topStyles: StyleSignalDto[];
  topEditPresets: EditPresetSignalDto[];
  favoriteStyles: StyleDto[];
  favoriteMockupCategories: MockupCategorySignalDto[];
  preferredColors: TextSignalDto[];
  preferredTypography: TextSignalDto[];
  topIndustries: TextSignalDto[];
}

export function fetchDesignMemory() {
  return apiFetch<{ profile: DesignMemoryProfileDto }>("/api/design-memory");
}

export function updateDesignMemorySettings(enabled: boolean) {
  return apiFetch<{ settings: DesignMemorySettingsDto }>("/api/design-memory/settings", {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}

export function resetDesignMemory() {
  return apiFetch<{ settings: DesignMemorySettingsDto }>("/api/design-memory/reset", { method: "POST" });
}
