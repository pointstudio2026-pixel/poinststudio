import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import type { Interview } from "@/modules/interviews/domain/Interview";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";
import { WORKSPACE_STEPS } from "@/modules/projects/domain/Project";
import { getOrCreateActiveInterview } from "@/modules/interviews/application/getOrCreateActiveInterview";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

export class CompleteInterviewUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly interviewRepository: InterviewRepository,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<Interview> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const interview = await getOrCreateActiveInterview(this.interviewRepository, input.projectId);

    const missing = INTERVIEW_QUESTIONS.filter((q) => q.required).filter((q) => {
      const found = interview.answers.find((a) => a.questionKey === q.key);
      return !found || !found.answer?.trim();
    });
    if (missing.length > 0) {
      throw new ValidationError(
        `필수 질문에 답변하지 않았습니다: ${missing.map((q) => q.text).join(", ")}`,
        undefined,
        "INT-002",
      );
    }

    const completed = await this.interviewRepository.complete(interview.id);

    const nextStepIndex = WORKSPACE_STEPS.findIndex((s) => s.key === "brand_brief");
    await this.projectRepository.save({
      ...project,
      currentStep: WORKSPACE_STEPS[nextStepIndex]!.key,
      updatedAt: new Date(),
    });

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "INTERVIEW_COMPLETED",
    });

    return completed;
  }
}
