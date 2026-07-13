import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { BrandBriefRepository } from "@/modules/brandBriefs/domain/BrandBriefRepository";
import type { BrandBrief } from "@/modules/brandBriefs/domain/BrandBrief";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError } from "@/shared/errors/AppError";

export class RestoreBrandBriefVersionUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly brandBriefRepository: BrandBriefRepository,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
    versionNumber: number;
  }): Promise<BrandBrief> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const existing = await this.brandBriefRepository.findByProjectId(input.projectId);
    if (!existing) {
      throw new NotFoundError("Brand Brief가 아직 생성되지 않았습니다.", "BRAND_BRIEF_NOT_FOUND");
    }

    const target = await this.brandBriefRepository.getVersion(existing.id, input.versionNumber);
    if (!target) {
      throw new NotFoundError("복원할 버전을 찾을 수 없습니다.", "BRAND_BRIEF_VERSION_NOT_FOUND");
    }

    // 되돌리기도 기존 버전을 덮어쓰지 않고, 그 내용을 담은 새 버전을 만든다.
    const restored = await this.brandBriefRepository.addVersion(
      existing.id,
      target.data,
      "user",
      input.userId,
    );

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "BRAND_BRIEF_VERSION_RESTORED",
      payload: { restoredFrom: input.versionNumber, newVersion: restored.currentVersion.versionNumber },
    });

    return restored;
  }
}
