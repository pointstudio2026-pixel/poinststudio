import type {
  BrandStrategy,
  BrandStrategyData,
  BrandStrategyVersion,
  ConfidenceLevel,
} from "@/modules/brandStrategies/domain/BrandStrategy";
import type { BrandStrategyRepository } from "@/modules/brandStrategies/domain/BrandStrategyRepository";

export class FakeBrandStrategyRepository implements BrandStrategyRepository {
  strategies = new Map<string, { id: string; projectId: string }>();
  versions: BrandStrategyVersion[] = [];
  private nextStrategyId = 1;
  private nextVersionId = 1;

  async findByProjectId(projectId: string): Promise<BrandStrategy | null> {
    const strategy = [...this.strategies.values()].find((s) => s.projectId === projectId);
    if (!strategy) return null;
    const current = this.versions
      .filter((v) => v.brandStrategyId === strategy.id)
      .sort((a, b) => b.versionNumber - a.versionNumber)[0];
    if (!current) return null;
    return { id: strategy.id, projectId: strategy.projectId, currentVersion: current };
  }

  async createWithFirstVersion(
    projectId: string,
    candidates: BrandStrategyData[],
    reasoningSummary: string,
    confidenceLevel: ConfidenceLevel,
  ): Promise<BrandStrategy> {
    const id = `strategy-${this.nextStrategyId++}`;
    this.strategies.set(id, { id, projectId });
    const version: BrandStrategyVersion = {
      id: `strategy-version-${this.nextVersionId++}`,
      brandStrategyId: id,
      versionNumber: 1,
      data: candidates[0]!,
      candidates,
      selectedIndex: null,
      reasoningSummary,
      confidenceLevel,
      createdAt: new Date(),
    };
    this.versions.push(version);
    return { id, projectId, currentVersion: version };
  }

  async addVersion(
    brandStrategyId: string,
    candidates: BrandStrategyData[],
    reasoningSummary: string,
    confidenceLevel: ConfidenceLevel,
  ): Promise<BrandStrategy> {
    const strategy = this.strategies.get(brandStrategyId);
    if (!strategy) throw new Error("strategy not found");
    const lastVersionNumber = Math.max(
      0,
      ...this.versions.filter((v) => v.brandStrategyId === brandStrategyId).map((v) => v.versionNumber),
    );
    const version: BrandStrategyVersion = {
      id: `strategy-version-${this.nextVersionId++}`,
      brandStrategyId,
      versionNumber: lastVersionNumber + 1,
      data: candidates[0]!,
      candidates,
      selectedIndex: null,
      reasoningSummary,
      confidenceLevel,
      createdAt: new Date(),
    };
    this.versions.push(version);
    return { id: brandStrategyId, projectId: strategy.projectId, currentVersion: version };
  }

  async selectCandidate(brandStrategyId: string, candidateIndex: number): Promise<BrandStrategy> {
    const strategy = this.strategies.get(brandStrategyId);
    if (!strategy) throw new Error("strategy not found");
    const current = this.versions
      .filter((v) => v.brandStrategyId === brandStrategyId)
      .sort((a, b) => b.versionNumber - a.versionNumber)[0];
    if (!current) throw new Error("no current version");
    const selected = current.candidates[candidateIndex]!;
    current.data = selected;
    current.selectedIndex = candidateIndex;
    current.reasoningSummary = selected.brandKnowledge.reasoningSummary;
    return { id: brandStrategyId, projectId: strategy.projectId, currentVersion: current };
  }

  async listVersions(brandStrategyId: string): Promise<BrandStrategyVersion[]> {
    return this.versions
      .filter((v) => v.brandStrategyId === brandStrategyId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }
}
