import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import type { BrandBriefRepository } from "@/modules/brandBriefs/domain/BrandBriefRepository";
import type { BrandStrategyRepository } from "@/modules/brandStrategies/domain/BrandStrategyRepository";
import type { BrandStrategy } from "@/modules/brandStrategies/domain/BrandStrategy";
import type { AsterBrainComposer } from "@/modules/brandStrategies/application/AsterBrainComposer";
import { WORKSPACE_STEPS } from "@/modules/projects/domain/Project";
import { recordActivity } from "@/shared/activity/activityLogger";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

export type ExecuteAsterBrainMode = "execute" | "rebuild";

export class ExecuteAsterBrainUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly brandBriefRepository: BrandBriefRepository,
    private readonly brandStrategyRepository: BrandStrategyRepository,
    private readonly composer: AsterBrainComposer,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
    mode: ExecuteAsterBrainMode;
  }): Promise<BrandStrategy> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    // BRAIN-001 Missing Input: Aster Brain은 Brand Brief를 유일한 입력으로 사용한다.
    const brief = await this.brandBriefRepository.findByProjectId(input.projectId);
    if (!brief) {
      throw new ConflictError(
        "Brand Brief를 먼저 생성해야 Aster Brain 분석을 실행할 수 있습니다.",
        "BRAND_BRIEF_REQUIRED",
      );
    }

    const existing = await this.brandStrategyRepository.findByProjectId(input.projectId);
    // "execute"는 최초 실행(또는 이미 있으면 기존 결과 반환)이고, "재분석"은
    // 항상 새 버전을 만드는 "rebuild"로만 수행한다.
    if (existing && input.mode === "execute") {
      return existing;
    }

    const interview = await this.interviewRepository.findLatestByProjectId(input.projectId);
    const answers = Object.fromEntries(
      (interview?.answers ?? []).filter((a) => a.answer).map((a) => [a.questionKey, a.answer as string]),
    );

    const { data, reasoningSummary, confidenceLevel } = await this.composer.compose(
      brief.currentVersion.data,
      brief.currentVersion.source,
      answers,
    );

    const strategy = existing
      ? await this.brandStrategyRepository.addVersion(existing.id, data, reasoningSummary, confidenceLevel)
      : await this.brandStrategyRepository.createWithFirstVersion(
          input.projectId,
          data,
          reasoningSummary,
          confidenceLevel,
        );

    const stepIndex = WORKSPACE_STEPS.findIndex((s) => s.key === "brand_strategy");
    const nextStep = WORKSPACE_STEPS[stepIndex + 1];
    if (nextStep && project.currentStep === "brand_strategy") {
      await this.projectRepository.save({ ...project, currentStep: nextStep.key, updatedAt: new Date() });
    }

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: input.mode === "rebuild" ? "BRAND_STRATEGY_REBUILT" : "BRAND_STRATEGY_GENERATED",
      payload: { version: strategy.currentVersion.versionNumber, confidence: confidenceLevel },
    });

    return strategy;
  }
}
