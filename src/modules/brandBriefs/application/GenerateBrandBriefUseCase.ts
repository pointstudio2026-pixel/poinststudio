import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import type { BrandBriefRepository } from "@/modules/brandBriefs/domain/BrandBriefRepository";
import type { BrandBrief } from "@/modules/brandBriefs/domain/BrandBrief";
import type { BrandBriefComposer } from "@/modules/brandBriefs/application/BrandBriefComposer";
import { WORKSPACE_STEPS } from "@/modules/projects/domain/Project";
import { recordActivity } from "@/shared/activity/activityLogger";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

export class GenerateBrandBriefUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly brandBriefRepository: BrandBriefRepository,
    private readonly composer: BrandBriefComposer,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<BrandBrief> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    // "인터뷰 정보 부족": Brand Brief는 완료된 인터뷰가 있어야 생성할 수 있다.
    const interview = await this.interviewRepository.findLatestByProjectId(input.projectId);
    if (!interview || interview.status !== "completed") {
      throw new ConflictError(
        "Brand Interview를 먼저 완료해야 Brand Brief를 생성할 수 있습니다.",
        "INTERVIEW_NOT_COMPLETED",
      );
    }

    const answers = Object.fromEntries(
      interview.answers.filter((a) => a.answer).map((a) => [a.questionKey, a.answer as string]),
    );
    const data = await this.composer.compose(answers);

    const existing = await this.brandBriefRepository.findByProjectId(input.projectId);
    const brief = existing
      ? await this.brandBriefRepository.addVersion(existing.id, data, "ai")
      : await this.brandBriefRepository.createWithFirstVersion(input.projectId, data, "ai");

    const briefStepIndex = WORKSPACE_STEPS.findIndex((s) => s.key === "brand_brief");
    const nextStep = WORKSPACE_STEPS[briefStepIndex + 1];
    if (nextStep && project.currentStep === "brand_brief") {
      await this.projectRepository.save({ ...project, currentStep: nextStep.key, updatedAt: new Date() });
    }

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "BRAND_BRIEF_GENERATED",
      payload: { version: brief.currentVersion.versionNumber },
    });

    return brief;
  }
}
