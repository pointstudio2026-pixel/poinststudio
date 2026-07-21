import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { BrandStrategyRepository } from "@/modules/brandStrategies/domain/BrandStrategyRepository";
import type { BrandStrategy } from "@/modules/brandStrategies/domain/BrandStrategy";
import { getWorkspaceSteps } from "@/modules/projects/domain/Project";
import { recordActivity } from "@/shared/activity/activityLogger";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors/AppError";

export class SelectBrandStrategyUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly brandStrategyRepository: BrandStrategyRepository,
  ) {}

  async execute(input: { projectId: string; userId: string; candidateIndex: number }): Promise<BrandStrategy> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const strategy = await this.brandStrategyRepository.findByProjectId(input.projectId);
    if (!strategy) {
      throw new ConflictError(
        "Aster Brain 분석을 먼저 실행해야 전략을 선택할 수 있습니다.",
        "BRAND_STRATEGY_NOT_FOUND",
      );
    }

    const candidateCount = strategy.currentVersion.candidates.length;
    if (
      !Number.isInteger(input.candidateIndex) ||
      input.candidateIndex < 0 ||
      input.candidateIndex >= candidateCount
    ) {
      throw new ValidationError("올바른 전략 후보를 선택해주세요.", undefined, "BRAND_STRATEGY-001");
    }

    const updated = await this.brandStrategyRepository.selectCandidate(strategy.id, input.candidateIndex);

    const steps = getWorkspaceSteps(project.deliverableType);
    const stepIndex = steps.findIndex((s) => s.key === "brand_strategy");
    const nextStep = steps[stepIndex + 1];
    if (nextStep && project.currentStep === "brand_strategy") {
      await this.projectRepository.save({ ...project, currentStep: nextStep.key, updatedAt: new Date() });
    }

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "BRAND_STRATEGY_SELECTED",
      payload: { candidateIndex: input.candidateIndex },
    });

    return updated;
  }
}
