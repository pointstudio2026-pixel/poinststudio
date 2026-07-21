import type { DesignMemorySettingsRepository } from "@/modules/designMemory/domain/DesignMemorySettingsRepository";
import type { DesignMemorySignalsRepository } from "@/modules/designMemory/domain/DesignMemorySignalsRepository";
import type { StyleRepository } from "@/modules/styles/domain/StyleRepository";
import type { StyleFavoriteRepository } from "@/modules/styles/domain/StyleFavoriteRepository";
import type { DesignMemoryProfile } from "@/modules/designMemory/domain/DesignMemory";
import { composeDesignMemoryProfile } from "@/modules/designMemory/domain/designMemoryComposer";

const TOP_SIGNAL_LIMIT = 5;
const EPOCH = new Date(0);

export class GetDesignMemoryUseCase {
  constructor(
    private readonly settingsRepository: DesignMemorySettingsRepository,
    private readonly signalsRepository: DesignMemorySignalsRepository,
    private readonly styleRepository: StyleRepository,
    private readonly styleFavoriteRepository: StyleFavoriteRepository,
  ) {}

  async execute(input: { userId: string }): Promise<DesignMemoryProfile> {
    const settings =
      (await this.settingsRepository.findByUserId(input.userId)) ??
      (await this.settingsRepository.createDefault(input.userId));

    if (!settings.enabled) {
      return composeDesignMemoryProfile({
        enabled: false,
        resetAt: settings.resetAt,
        styleCounts: [],
        stylesById: new Map(),
        editPresetCounts: [],
        favoriteStyles: [],
        strategySignals: [],
        mockupCategoryCounts: [],
      });
    }

    const since = settings.resetAt ?? EPOCH;

    const [styleCounts, editPresetCounts, strategySignals, mockupCategoryCounts, favoriteStyles] = await Promise.all([
      this.signalsRepository.topStyleSelections(input.userId, since, TOP_SIGNAL_LIMIT),
      this.signalsRepository.topEditPresets(input.userId, since, TOP_SIGNAL_LIMIT),
      this.signalsRepository.listBrandStrategySignals(input.userId, since),
      this.signalsRepository.favoriteMockupCategories(input.userId),
      this.styleFavoriteRepository.listByUserId(input.userId),
    ]);

    const styles = await this.styleRepository.findByIds(styleCounts.map((c) => c.styleId));
    const stylesById = new Map(styles.map((s) => [s.id, s]));

    return composeDesignMemoryProfile({
      enabled: true,
      resetAt: settings.resetAt,
      styleCounts,
      stylesById,
      editPresetCounts,
      favoriteStyles,
      strategySignals,
      mockupCategoryCounts,
    });
  }
}
