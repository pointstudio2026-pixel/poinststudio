import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { BrandBriefRepository } from "@/modules/brandBriefs/domain/BrandBriefRepository";
import type { BrandBrief, BrandBriefData } from "@/modules/brandBriefs/domain/BrandBrief";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError } from "@/shared/errors/AppError";

export class UpdateBrandBriefUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly brandBriefRepository: BrandBriefRepository,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
    patch: Partial<BrandBriefData>;
  }): Promise<BrandBrief> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const existing = await this.brandBriefRepository.findByProjectId(input.projectId);
    if (!existing) {
      throw new NotFoundError("Brand Brief가 아직 생성되지 않았습니다.", "BRAND_BRIEF_NOT_FOUND");
    }

    // 덮어쓰기가 아니라 신규 버전 생성 — 이전 버전은 그대로 보존된다.
    const merged: BrandBriefData = { ...existing.currentVersion.data, ...input.patch };
    const updated = await this.brandBriefRepository.addVersion(
      existing.id,
      merged,
      "user",
      input.userId,
    );

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "BRAND_BRIEF_UPDATED",
      payload: { version: updated.currentVersion.versionNumber, fields: Object.keys(input.patch) },
    });

    return updated;
  }
}
