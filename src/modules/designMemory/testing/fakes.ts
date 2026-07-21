import type { DesignMemorySettings } from "@/modules/designMemory/domain/DesignMemory";
import type { DesignMemorySettingsRepository } from "@/modules/designMemory/domain/DesignMemorySettingsRepository";
import type {
  BrandStrategySignalRow,
  DesignMemorySignalsRepository,
  EditPresetCount,
  MockupCategoryCount,
  StyleSelectionCount,
} from "@/modules/designMemory/domain/DesignMemorySignalsRepository";

export class FakeDesignMemorySettingsRepository implements DesignMemorySettingsRepository {
  settings = new Map<string, DesignMemorySettings>();

  async findByUserId(userId: string): Promise<DesignMemorySettings | null> {
    return this.settings.get(userId) ?? null;
  }

  async createDefault(userId: string): Promise<DesignMemorySettings> {
    const existing = this.settings.get(userId);
    if (existing) return existing;
    const settings: DesignMemorySettings = { userId, enabled: true, resetAt: null };
    this.settings.set(userId, settings);
    return settings;
  }

  async setEnabled(userId: string, enabled: boolean): Promise<DesignMemorySettings> {
    const current = this.settings.get(userId) ?? { userId, enabled: true, resetAt: null };
    const updated = { ...current, enabled };
    this.settings.set(userId, updated);
    return updated;
  }

  async resetNow(userId: string): Promise<DesignMemorySettings> {
    const current = this.settings.get(userId) ?? { userId, enabled: true, resetAt: null };
    const updated = { ...current, resetAt: new Date() };
    this.settings.set(userId, updated);
    return updated;
  }
}

export class FakeDesignMemorySignalsRepository implements DesignMemorySignalsRepository {
  styleCounts: StyleSelectionCount[] = [];
  editPresetCounts: EditPresetCount[] = [];
  strategySignals: BrandStrategySignalRow[] = [];
  mockupCategoryCounts: MockupCategoryCount[] = [];

  async topStyleSelections(_userId: string, _since: Date, limit: number): Promise<StyleSelectionCount[]> {
    return this.styleCounts.slice(0, limit);
  }

  async topEditPresets(_userId: string, _since: Date, limit: number): Promise<EditPresetCount[]> {
    return this.editPresetCounts.slice(0, limit);
  }

  async listBrandStrategySignals(_userId: string, _since: Date): Promise<BrandStrategySignalRow[]> {
    return this.strategySignals;
  }

  async favoriteMockupCategories(_userId: string): Promise<MockupCategoryCount[]> {
    return this.mockupCategoryCounts;
  }
}
