import type { Style } from "@/modules/styles/domain/Style";
import { EDIT_PRESETS, isEditPresetKey } from "@/modules/edits/domain/EditPresets";
import { MOCKUP_CATEGORIES, type MockupCategory } from "@/modules/mockups/domain/Mockup";
import type {
  BrandStrategySignalRow,
  EditPresetCount,
  MockupCategoryCount,
  StyleSelectionCount,
} from "@/modules/designMemory/domain/DesignMemorySignalsRepository";
import type { DesignMemoryProfile, TextSignal } from "@/modules/designMemory/domain/DesignMemory";

function countTextValues(values: string[]): TextSignal[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function isMockupCategory(value: string): value is MockupCategory {
  return (MOCKUP_CATEGORIES as readonly string[]).includes(value);
}

export function composeDesignMemoryProfile(input: {
  enabled: boolean;
  resetAt: Date | null;
  styleCounts: StyleSelectionCount[];
  stylesById: Map<string, Style>;
  editPresetCounts: EditPresetCount[];
  favoriteStyles: Style[];
  strategySignals: BrandStrategySignalRow[];
  mockupCategoryCounts: MockupCategoryCount[];
}): DesignMemoryProfile {
  if (!input.enabled) {
    return {
      enabled: false,
      resetAt: input.resetAt,
      signalCount: 0,
      topStyles: [],
      topEditPresets: [],
      favoriteStyles: [],
      favoriteMockupCategories: [],
      preferredColors: [],
      preferredTypography: [],
      topIndustries: [],
    };
  }

  const topStyles = input.styleCounts
    .map((c) => {
      const style = input.stylesById.get(c.styleId);
      if (!style) return null;
      return {
        style,
        count: c.count,
        reason: `최근 프로젝트에서 ${c.count}번 선택한 스타일입니다.`,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const topEditPresets = input.editPresetCounts
    .filter((c) => isEditPresetKey(c.presetKey))
    .map((c) => {
      const preset = EDIT_PRESETS[c.presetKey as keyof typeof EDIT_PRESETS];
      return {
        presetKey: preset.key,
        label: preset.label,
        count: c.count,
        reason: `"${preset.label}" 수정을 ${c.count}번 적용했습니다.`,
      };
    });

  const favoriteMockupCategories = input.mockupCategoryCounts
    .filter((c) => isMockupCategory(c.category))
    .map((c) => ({
      category: c.category as MockupCategory,
      count: c.count,
      reason: `이 카테고리의 목업을 ${c.count}번 즐겨찾기했습니다.`,
    }))
    .sort((a, b) => b.count - a.count);

  const signalCount =
    input.styleCounts.reduce((sum, c) => sum + c.count, 0) +
    input.editPresetCounts.reduce((sum, c) => sum + c.count, 0) +
    input.strategySignals.length;

  return {
    enabled: true,
    resetAt: input.resetAt,
    signalCount,
    topStyles,
    topEditPresets,
    favoriteStyles: input.favoriteStyles,
    favoriteMockupCategories,
    preferredColors: countTextValues(input.strategySignals.map((b) => b.preferredColor)),
    preferredTypography: countTextValues(input.strategySignals.map((b) => b.typographyDirection)),
    topIndustries: countTextValues(input.strategySignals.map((b) => b.industry)),
  };
}
