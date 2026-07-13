import type { Style } from "@/modules/styles/domain/Style";
import type { EditPresetKey } from "@/modules/edits/domain/EditPresets";
import type { MockupCategory } from "@/modules/mockups/domain/Mockup";

export interface DesignMemorySettings {
  userId: string;
  enabled: boolean;
  resetAt: Date | null;
}

export interface StyleSignal {
  style: Style;
  count: number;
  reason: string;
}

export interface EditPresetSignal {
  presetKey: EditPresetKey;
  label: string;
  count: number;
  reason: string;
}

export interface TextSignal {
  value: string;
  count: number;
}

export interface MockupCategorySignal {
  category: MockupCategory;
  count: number;
  reason: string;
}

export interface DesignMemoryProfile {
  enabled: boolean;
  resetAt: Date | null;
  signalCount: number;
  topStyles: StyleSignal[];
  topEditPresets: EditPresetSignal[];
  favoriteStyles: Style[];
  favoriteMockupCategories: MockupCategorySignal[];
  preferredColors: TextSignal[];
  preferredTypography: TextSignal[];
  topIndustries: TextSignal[];
}
