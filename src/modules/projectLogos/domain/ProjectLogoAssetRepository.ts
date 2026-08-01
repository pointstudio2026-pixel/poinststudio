import type { ProjectLogoAsset } from "@/modules/projectLogos/domain/ProjectLogoAsset";

export interface ProjectLogoAssetRepository {
  /** 프로젝트당 1개(v1) -- 이미 있으면 새 파일로 교체(upsert)한다. 매번
   * confirmed:false로 리셋된다 -- 파일을 새로 올렸으면 다시 확정해야 한다. */
  save(input: {
    projectId: string;
    storageKey: string;
    contentType: string;
    originalFileName?: string | null;
  }): Promise<ProjectLogoAsset>;
  findByProjectId(projectId: string): Promise<ProjectLogoAsset | null>;
  deleteByProjectId(projectId: string): Promise<void>;
  /** SelectLogoChoiceUseCase의 "upload" 선택에서만 호출 -- 업로드만 하고
   * 확정하지 않은 자산이 생성 파이프라인에 쓰이지 않게 하는 게이트. */
  markConfirmed(projectId: string): Promise<void>;
}
