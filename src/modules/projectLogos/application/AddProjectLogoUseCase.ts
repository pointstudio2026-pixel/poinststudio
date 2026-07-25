import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { ProjectLogoAssetRepository } from "@/modules/projectLogos/domain/ProjectLogoAssetRepository";
import type { ProjectLogoAsset } from "@/modules/projectLogos/domain/ProjectLogoAsset";
import { MAX_LOGO_SIZE_BYTES, isAllowedLogoContentType } from "@/modules/projectLogos/domain/projectLogoRules";
import type { FileStorage } from "@/shared/storage/FileStorage";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

export class AddProjectLogoUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly logoAssetRepository: ProjectLogoAssetRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: {
    userId: string;
    projectId: string;
    data: Buffer;
    contentType: string;
    originalFileName?: string;
  }): Promise<ProjectLogoAsset> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    if (!isAllowedLogoContentType(input.contentType)) {
      throw new ValidationError("PNG 또는 JPEG 이미지만 업로드할 수 있습니다.", undefined, "PROJECT_LOGO-001");
    }
    if (input.data.byteLength > MAX_LOGO_SIZE_BYTES) {
      throw new ValidationError("이미지 용량은 5MB를 초과할 수 없습니다.", undefined, "PROJECT_LOGO-002");
    }

    const storageKey = `project-logos/${project.id}/${crypto.randomUUID()}`;
    const saved = await this.fileStorage.save(storageKey, input.data, input.contentType);
    const asset = await this.logoAssetRepository.save({
      projectId: project.id,
      storageKey: saved.key,
      contentType: input.contentType,
      originalFileName: input.originalFileName,
    });

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "PROJECT_LOGO_UPLOADED",
      payload: { contentType: input.contentType },
    });

    return asset;
  }
}
