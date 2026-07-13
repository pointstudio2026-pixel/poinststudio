import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import type { Interview } from "@/modules/interviews/domain/Interview";
import { INTERVIEW_QUESTIONS, type InterviewQuestionDef } from "@/modules/interviews/domain/interviewQuestions";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError } from "@/shared/errors/AppError";

export interface GetOrStartInterviewOutput {
  interview: Interview;
  questions: InterviewQuestionDef[];
}

export class GetOrStartInterviewUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly interviewRepository: InterviewRepository,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<GetOrStartInterviewOutput> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    // Returns the completed interview as-is if one exists ("완료 후 재진입"
    // must show the finished state, not silently start a new one).
    let interview = await this.interviewRepository.findLatestByProjectId(input.projectId);
    if (!interview) {
      interview = await this.interviewRepository.create(input.projectId);
      await recordActivity({
        userId: input.userId,
        projectId: input.projectId,
        eventType: "INTERVIEW_STARTED",
      });
    }

    return { interview, questions: INTERVIEW_QUESTIONS };
  }
}
