import type {
  BrandBrief,
  BrandBriefData,
  BrandBriefVersion,
  BrandBriefVersionSource,
} from "@/modules/brandBriefs/domain/BrandBrief";
import type { BrandBriefRepository } from "@/modules/brandBriefs/domain/BrandBriefRepository";

export class FakeBrandBriefRepository implements BrandBriefRepository {
  briefs = new Map<string, { id: string; projectId: string }>();
  versions: BrandBriefVersion[] = [];
  private nextBriefId = 1;
  private nextVersionId = 1;

  async findByProjectId(projectId: string): Promise<BrandBrief | null> {
    const brief = [...this.briefs.values()].find((b) => b.projectId === projectId);
    if (!brief) return null;
    const current = this.versions
      .filter((v) => v.brandBriefId === brief.id)
      .sort((a, b) => b.versionNumber - a.versionNumber)[0];
    if (!current) return null;
    return { id: brief.id, projectId: brief.projectId, currentVersion: current };
  }

  async createWithFirstVersion(
    projectId: string,
    data: BrandBriefData,
    source: BrandBriefVersionSource,
  ): Promise<BrandBrief> {
    const id = `brief-${this.nextBriefId++}`;
    this.briefs.set(id, { id, projectId });
    const version: BrandBriefVersion = {
      id: `version-${this.nextVersionId++}`,
      brandBriefId: id,
      versionNumber: 1,
      data,
      source,
      createdAt: new Date(),
    };
    this.versions.push(version);
    return { id, projectId, currentVersion: version };
  }

  async addVersion(
    brandBriefId: string,
    data: BrandBriefData,
    source: BrandBriefVersionSource,
  ): Promise<BrandBrief> {
    const brief = this.briefs.get(brandBriefId);
    if (!brief) throw new Error("brief not found");
    const lastVersionNumber = Math.max(
      0,
      ...this.versions.filter((v) => v.brandBriefId === brandBriefId).map((v) => v.versionNumber),
    );
    const version: BrandBriefVersion = {
      id: `version-${this.nextVersionId++}`,
      brandBriefId,
      versionNumber: lastVersionNumber + 1,
      data,
      source,
      createdAt: new Date(),
    };
    this.versions.push(version);
    return { id: brandBriefId, projectId: brief.projectId, currentVersion: version };
  }

  async listVersions(brandBriefId: string): Promise<BrandBriefVersion[]> {
    return this.versions
      .filter((v) => v.brandBriefId === brandBriefId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async getVersion(brandBriefId: string, versionNumber: number): Promise<BrandBriefVersion | null> {
    return (
      this.versions.find(
        (v) => v.brandBriefId === brandBriefId && v.versionNumber === versionNumber,
      ) ?? null
    );
  }
}
