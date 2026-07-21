export interface StyleSelectionCount {
  styleId: string;
  count: number;
}

export interface EditPresetCount {
  presetKey: string;
  count: number;
}

export interface BrandStrategySignalRow {
  industry: string;
  preferredColor: string;
  typographyDirection: string;
}

export interface MockupCategoryCount {
  category: string;
  count: number;
}

/**
 * Cross-module read model for Design Memory's recommendation aggregation
 * -- unlike every other repository in this codebase (scoped by
 * projectId), these queries filter by userId through a relation
 * (project.userId), since Design Memory's whole purpose is aggregating
 * signals across ALL of a user's projects.
 */
export interface DesignMemorySignalsRepository {
  topStyleSelections(userId: string, since: Date, limit: number): Promise<StyleSelectionCount[]>;
  topEditPresets(userId: string, since: Date, limit: number): Promise<EditPresetCount[]>;
  listBrandStrategySignals(userId: string, since: Date): Promise<BrandStrategySignalRow[]>;
  favoriteMockupCategories(userId: string): Promise<MockupCategoryCount[]>;
}
