import type { ProjectLogoAsset } from "@/modules/projectLogos/domain/ProjectLogoAsset";
import type { ProjectLogoAssetRepository } from "@/modules/projectLogos/domain/ProjectLogoAssetRepository";

export class FakeProjectLogoAssetRepository implements ProjectLogoAssetRepository {
  assets: ProjectLogoAsset[] = [];
  private nextId = 1;

  async save(input: {
    projectId: string;
    storageKey: string;
    contentType: string;
    originalFileName?: string | null;
  }): Promise<ProjectLogoAsset> {
    const existing = this.assets.find((a) => a.projectId === input.projectId);
    if (existing) {
      existing.storageKey = input.storageKey;
      existing.contentType = input.contentType;
      existing.originalFileName = input.originalFileName ?? null;
      return existing;
    }
    const asset: ProjectLogoAsset = {
      id: `project-logo-asset-${this.nextId++}`,
      projectId: input.projectId,
      storageKey: input.storageKey,
      contentType: input.contentType,
      originalFileName: input.originalFileName ?? null,
      createdAt: new Date(),
    };
    this.assets.push(asset);
    return asset;
  }

  async findByProjectId(projectId: string): Promise<ProjectLogoAsset | null> {
    return this.assets.find((a) => a.projectId === projectId) ?? null;
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    this.assets = this.assets.filter((a) => a.projectId !== projectId);
  }
}
