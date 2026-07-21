import type {
  BrandStrategy,
  BrandStrategyData,
  BrandStrategyVersion,
  ConfidenceLevel,
} from "@/modules/brandStrategies/domain/BrandStrategy";

export interface BrandStrategyRepository {
  findByProjectId(projectId: string): Promise<BrandStrategy | null>;
  /** Creates the strategy and its first version (v1) with 3 candidates, `data` = candidates[0] (provisional). */
  createWithFirstVersion(
    projectId: string,
    candidates: BrandStrategyData[],
    reasoningSummary: string,
    confidenceLevel: ConfidenceLevel,
  ): Promise<BrandStrategy>;
  /** Appends a new version (fresh 3 candidates, unselected) and makes it current — never overwrites a prior version. */
  addVersion(
    brandStrategyId: string,
    candidates: BrandStrategyData[],
    reasoningSummary: string,
    confidenceLevel: ConfidenceLevel,
  ): Promise<BrandStrategy>;
  /** Confirms which of the current version's candidates the user picked; updates `data`/`selectedIndex` in place. */
  selectCandidate(brandStrategyId: string, candidateIndex: number): Promise<BrandStrategy>;
  listVersions(brandStrategyId: string): Promise<BrandStrategyVersion[]>;
}
