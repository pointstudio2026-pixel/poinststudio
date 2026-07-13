import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import type { Interview } from "@/modules/interviews/domain/Interview";
import type { InterviewQuestionDef } from "@/modules/interviews/domain/interviewQuestions";
import { getMissingRequiredQuestions, selectQuestions } from "@/modules/interviews/domain/QuestionSelector";
import { getOrCreateActiveInterview } from "@/modules/interviews/application/getOrCreateActiveInterview";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

export interface SaveAnswerInput {
  projectId: string;
  userId: string;
  questionKey: string;
  answer: string;
}

export interface SaveAnswerOutput {
  interview: Interview;
  questions: InterviewQuestionDef[];
  readyToComplete: boolean;
}

export class SaveAnswerUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly interviewRepository: InterviewRepository,
  ) {}

  async execute(input: SaveAnswerInput): Promise<SaveAnswerOutput> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const interview = await getOrCreateActiveInterview(this.interviewRepository, input.projectId);

    // industry 답변에 따라 목록이 바뀌므로 매번 현재 상태 기준으로
    // 다시 계산한다 (이번 저장 대상 질문은 이미 목록에 포함되어 있다 —
    // 기본 질문은 항상 존재하고, follow-up은 생성 시점에 먼저 저장된다).
    const questions = selectQuestions(interview);
    const questionIndex = questions.findIndex((q) => q.key === input.questionKey);
    if (questionIndex === -1) {
      throw new ValidationError("알 수 없는 질문입니다.", undefined, "INT-002");
    }

    const question = questions[questionIndex]!;
    if (question.required && !input.answer.trim()) {
      throw new ValidationError(`"${question.text}"에 대한 답변은 필수입니다.`, undefined, "INT-002");
    }

    await this.interviewRepository.saveAnswer(interview.id, {
      questionKey: input.questionKey,
      questionText: question.text,
      answer: input.answer,
      sequence: questionIndex,
    });

    // 이전 질문을 수정하는 경우 진행률(currentQuestionIndex)은 되돌리지
    // 않는다 — 앞으로 나아간 최대 지점만 전진시킨다.
    if (questionIndex >= interview.currentQuestionIndex) {
      await this.interviewRepository.updateCurrentQuestionIndex(interview.id, questionIndex + 1);
    }

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "INTERVIEW_ANSWER_SAVED",
      payload: { questionKey: input.questionKey },
    });

    const updated = (await this.interviewRepository.findActiveByProjectId(input.projectId))!;
    const updatedQuestions = selectQuestions(updated);

    return {
      interview: updated,
      questions: updatedQuestions,
      readyToComplete: getMissingRequiredQuestions(updatedQuestions, updated.answers).length === 0,
    };
  }
}
