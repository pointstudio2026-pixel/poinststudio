import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { ProjectLogoAssetRepository } from "@/modules/projectLogos/domain/ProjectLogoAssetRepository";
import type { Project } from "@/modules/projects/domain/Project";
import { getWorkspaceSteps } from "@/modules/projects/domain/Project";
import type { FileStorage } from "@/shared/storage/FileStorage";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

export type LogoChoice = "upload" | "skip";

/**
 * SelectStyleUseCase와 동일한 단계 전진 패턴("logo_choice" -> "generation").
 * "upload"를 선택하려면 이미 ProjectLogoAsset이 첨부되어 있어야 한다("첨부"
 * 버튼은 업로드 성공 후에만 활성화되므로 정상 흐름에서는 항상 있음, 이건
 * 방어적 검증). "skip"을 선택하면 -- 업로드했다가 마음이 바뀐 경우를 위해
 * -- 기존에 첨부된 로고가 있으면 함께 지운다(생성 파이프라인은 "자산이
 * 있는가"만으로 분기하므로, 지우지 않으면 "상호명만"을 골라도 로고 합성
 * 경로를 타게 된다).
 */
export class SelectLogoChoiceUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly logoAssetRepository: ProjectLogoAssetRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: { userId: string; projectId: string; choice: LogoChoice }): Promise<Project> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    if (input.choice === "upload") {
      const asset = await this.logoAssetRepository.findByProjectId(project.id);
      if (!asset) {
        throw new ValidationError("먼저 로고 이미지를 첨부해주세요.", undefined, "PROJECT_LOGO-003");
      }
    } else {
      const existing = await this.logoAssetRepository.findByProjectId(project.id);
      if (existing) {
        await this.fileStorage.delete(existing.storageKey);
        await this.logoAssetRepository.deleteByProjectId(project.id);
      }
    }

    const steps = getWorkspaceSteps(project.deliverableType);
    const stepIndex = steps.findIndex((s) => s.key === "logo_choice");
    const nextStep = steps[stepIndex + 1];
    let updated = project;
    if (nextStep && project.currentStep === "logo_choice") {
      updated = { ...project, currentStep: nextStep.key, updatedAt: new Date() };
      await this.projectRepository.save(updated);
    }

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "LOGO_CHOICE_SELECTED",
      payload: { choice: input.choice },
    });

    return updated;
  }
}
