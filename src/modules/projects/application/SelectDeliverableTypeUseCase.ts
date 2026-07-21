import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { Project } from "@/modules/projects/domain/Project";
import { getWorkspaceSteps } from "@/modules/projects/domain/Project";
import { DELIVERABLE_TYPE_OPTIONS } from "@/modules/projects/domain/deliverableTypes";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

/**
 * 프로젝트 생성 직후 가장 먼저 묻는 단계 -- Style/LogoStyle/BrandStrategy와
 * 달리 이력 관리가 필요한 선택이 아니라 Project의 단순 필드이므로 별도
 * 서브엔티티 없이 이 유스케이스 하나로 저장 + 단계 전진을 처리한다.
 */
export class SelectDeliverableTypeUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: { projectId: string; userId: string; deliverableType: string }): Promise<Project> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    if (!DELIVERABLE_TYPE_OPTIONS.includes(input.deliverableType)) {
      throw new ValidationError("올바른 작업물 유형을 선택해주세요.", undefined, "DELIVERABLE_TYPE-001");
    }

    const steps = getWorkspaceSteps(input.deliverableType);
    const stepIndex = steps.findIndex((s) => s.key === "deliverable_type");
    const nextStep = steps[stepIndex + 1];

    const updated: Project = {
      ...project,
      deliverableType: input.deliverableType,
      currentStep: nextStep && project.currentStep === "deliverable_type" ? nextStep.key : project.currentStep,
      updatedAt: new Date(),
    };
    await this.projectRepository.save(updated);

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "DELIVERABLE_TYPE_SELECTED",
      payload: { deliverableType: input.deliverableType },
    });

    return updated;
  }
}
