import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { ProjectLogoAssetRepository } from "@/modules/projectLogos/domain/ProjectLogoAssetRepository";
import type { FileStorage } from "@/shared/storage/FileStorage";
import { NotFoundError } from "@/shared/errors/AppError";

/** GetUserStyleReferenceImageUseCase와 동일한 패턴 -- 소유자 인증 확인 후 Buffer 스트리밍. */
export class GetProjectLogoImageUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly logoAssetRepository: ProjectLogoAssetRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: { userId: string; projectId: string }): Promise<{ data: Buffer; contentType: string }> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const asset = await this.logoAssetRepository.findByProjectId(project.id);
    if (!asset) {
      throw new NotFoundError("첨부된 로고를 찾을 수 없습니다.", "PROJECT_LOGO_NOT_FOUND");
    }

    const file = await this.fileStorage.read(asset.storageKey);
    if (!file) {
      throw new NotFoundError("로고 파일을 찾을 수 없습니다.", "PROJECT_LOGO_FILE_NOT_FOUND");
    }

    return file;
  }
}
