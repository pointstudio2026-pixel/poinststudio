import type { Interview, InterviewAnswerRecord } from "@/modules/interviews/domain/Interview";
import { INTERVIEW_QUESTIONS, type InterviewQuestionDef } from "@/modules/interviews/domain/interviewQuestions";
import { matchIndustryQuestions } from "@/modules/interviews/domain/industryQuestions";

export const FOLLOW_UP_KEY_PREFIX = "followUp_";
export const MAX_FOLLOW_UP_QUESTIONS = 3;
const WEAK_ANSWER_LENGTH_THRESHOLD = 15;

/**
 * Rule-based question selection (no AI): base questions + whatever the
 * user's industry answer unlocks + any AI follow-up questions already
 * generated and persisted for this interview (see GenerateFollowUpUseCase).
 * Always recomputed from `interview.answers` so a page refresh reconstructs
 * the exact same list ("인터뷰 재개 시 동일 상태 복원").
 */
export function selectQuestions(interview: Interview): InterviewQuestionDef[] {
  const industryAnswer = interview.answers.find((a) => a.questionKey === "industry")?.answer ?? "";
  const industryExtra = matchIndustryQuestions(industryAnswer);

  const industryIndex = INTERVIEW_QUESTIONS.findIndex((q) => q.key === "industry");
  const base = [
    ...INTERVIEW_QUESTIONS.slice(0, industryIndex + 1),
    ...industryExtra,
    ...INTERVIEW_QUESTIONS.slice(industryIndex + 1),
  ];

  const followUps = interview.answers
    .filter((a) => a.questionKey.startsWith(FOLLOW_UP_KEY_PREFIX))
    .sort((a, b) => a.sequence - b.sequence)
    .map(
      (a): InterviewQuestionDef => ({
        key: a.questionKey,
        text: a.questionText,
        type: "textarea",
        required: true,
      }),
    );

  return [...base, ...followUps];
}

/**
 * Picks the weakest still-unprobed required answer (short answers read as
 * low-confidence). Already-followed-up questions are skipped so the same
 * gap is never asked about twice ("같은 질문 반복 금지").
 */
export function findWeakAnswer(
  questions: InterviewQuestionDef[],
  answers: InterviewAnswerRecord[],
): { key: string; text: string; answer: string } | null {
  for (const q of questions) {
    if (!q.required || q.key.startsWith(FOLLOW_UP_KEY_PREFIX)) continue;

    const record = answers.find((a) => a.questionKey === q.key);
    if (!record?.answer) continue;

    const alreadyFollowedUp = answers.some(
      (a) => a.questionKey === `${FOLLOW_UP_KEY_PREFIX}${q.key}`,
    );
    if (alreadyFollowedUp) continue;

    if (record.answer.trim().length < WEAK_ANSWER_LENGTH_THRESHOLD) {
      return { key: q.key, text: q.text, answer: record.answer };
    }
  }
  return null;
}

export function getMissingRequiredQuestions(
  questions: InterviewQuestionDef[],
  answers: InterviewAnswerRecord[],
): InterviewQuestionDef[] {
  return questions.filter((q) => q.required).filter((q) => {
    const found = answers.find((a) => a.questionKey === q.key);
    return !found || !found.answer?.trim();
  });
}
