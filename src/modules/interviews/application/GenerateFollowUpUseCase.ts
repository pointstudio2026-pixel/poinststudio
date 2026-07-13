import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import type { Interview } from "@/modules/interviews/domain/Interview";
import type { InterviewQuestionDef } from "@/modules/interviews/domain/interviewQuestions";
import type { TextCompletionProvider } from "@/shared/ai/TextCompletionProvider";
import {
  FOLLOW_UP_KEY_PREFIX,
  MAX_FOLLOW_UP_QUESTIONS,
  findWeakAnswer,
  getMissingRequiredQuestions,
  selectQuestions,
} from "@/modules/interviews/domain/QuestionSelector";
import { getOrCreateActiveInterview } from "@/modules/interviews/application/getOrCreateActiveInterview";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError } from "@/shared/errors/AppError";

export interface GenerateFollowUpOutput {
  followUpGenerated: boolean;
  interview: Interview;
  questions: InterviewQuestionDef[];
  readyToComplete: boolean;
}

const FOLLOW_UP_SYSTEM_PROMPT =
  "당신은 브랜드 인터뷰어입니다. 사용자의 답변이 짧거나 구체성이 부족할 때, " +
  "그 답변에 대해 더 깊이 파고드는 한 문장의 간결한 한국어 후속 질문을 작성하세요. " +
  "이미 확보한 정보는 다시 묻지 않고, 질문 문장만 출력하세요.";

/**
 * "추가 질문만 AI를 사용한다" (Task-008 Claude Code Execution Prompt) —
 * base/industry question selection is pure rule-based (QuestionSelector);
 * only this step calls the AI provider, and only for the specific weak
 * answer it targets.
 */
export class GenerateFollowUpUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly textCompletionProvider: TextCompletionProvider,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<GenerateFollowUpOutput> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const interview = await getOrCreateActiveInterview(this.interviewRepository, input.projectId);
    const questions = selectQuestions(interview);

    const readyToComplete = getMissingRequiredQuestions(questions, interview.answers).length === 0;

    const existingFollowUps = interview.answers.filter((a) =>
      a.questionKey.startsWith(FOLLOW_UP_KEY_PREFIX),
    ).length;
    if (existingFollowUps >= MAX_FOLLOW_UP_QUESTIONS) {
      return { followUpGenerated: false, interview, questions, readyToComplete };
    }

    const weak = findWeakAnswer(questions, interview.answers);
    if (!weak) {
      return { followUpGenerated: false, interview, questions, readyToComplete };
    }

    const brandName = interview.answers.find((a) => a.questionKey === "brandName")?.answer ?? "";
    const industry = interview.answers.find((a) => a.questionKey === "industry")?.answer ?? "";

    const result = await this.textCompletionProvider.complete({
      systemPrompt: FOLLOW_UP_SYSTEM_PROMPT,
      userPrompt: [
        `브랜드명: ${brandName}`,
        `업종: ${industry}`,
        `질문: "${weak.text}"`,
        `답변: "${weak.answer}"`,
        "이 답변에 대해 더 구체적인 정보를 얻기 위한 후속 질문을 한 문장으로 작성해주세요.",
      ].join("\n"),
      maxTokens: 100,
    });

    const followUpKey = `${FOLLOW_UP_KEY_PREFIX}${weak.key}`;
    await this.interviewRepository.saveAnswer(interview.id, {
      questionKey: followUpKey,
      questionText: result.text,
      answer: "",
      sequence: questions.length,
    });

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "INTERVIEW_FOLLOWUP_GENERATED",
      payload: { sourceQuestionKey: weak.key, provider: result.provider },
    });

    const updated = (await this.interviewRepository.findActiveByProjectId(input.projectId))!;
    const updatedQuestions = selectQuestions(updated);
    return {
      followUpGenerated: true,
      interview: updated,
      questions: updatedQuestions,
      readyToComplete:
        getMissingRequiredQuestions(updatedQuestions, updated.answers).length === 0,
    };
  }
}
