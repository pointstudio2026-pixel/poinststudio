import type { ProjectLogoAsset } from "@/modules/projectLogos/domain/ProjectLogoAsset";

export interface ProjectLogoAssetRepository {
  /** 프로젝트당 1개(v1) -- 이미 있으면 새 파일로 교체(upsert)한다. */
  save(input: {
    projectId: string;
    storageKey: string;
    contentType: string;
    originalFileName?: string | null;
  }): Promise<ProjectLogoAsset>;
  findByProjectId(projectId: string): Promise<ProjectLogoAsset | null>;
  deleteByProjectId(projectId: string): Promise<void>;
}
