import type {
  BrandStrategy,
  BrandStrategyData,
  BrandStrategyVersion,
  ConfidenceLevel,
} from "@/modules/brandStrategies/domain/BrandStrategy";

export interface BrandStrategyRepository {
  findByProjectId(projectId: string): Promise<BrandStrategy | null>;
  /** Creates the strategy and its first version (v1) in one step. */
  createWithFirstVersion(
    projectId: string,
    data: BrandStrategyData,
    reasoningSummary: string,
    confidenceLevel: ConfidenceLevel,
  ): Promise<BrandStrategy>;
  /** Appends a new version and makes it current — never overwrites a prior version. */
  addVersion(
    brandStrategyId: string,
    data: BrandStrategyData,
    reasoningSummary: string,
    confidenceLevel: ConfidenceLevel,
  ): Promise<BrandStrategy>;
  listVersions(brandStrategyId: string): Promise<BrandStrategyVersion[]>;
}
