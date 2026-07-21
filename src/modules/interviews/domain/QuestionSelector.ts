import type { Interview, InterviewAnswerRecord } from "@/modules/interviews/domain/Interview";
import {
  INTERVIEW_QUESTIONS,
  OTHER_ANSWER_PREFIX,
  type InterviewQuestionDef,
} from "@/modules/interviews/domain/interviewQuestions";
import { matchIndustryQuestions } from "@/modules/interviews/domain/industryQuestions";
import { matchDeliverableTypeQuestions } from "@/modules/interviews/domain/deliverableTypeQuestions";

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
export function selectQuestions(
  interview: Interview,
  deliverableType: string | null | undefined,
): InterviewQuestionDef[] {
  // "작업물 유형"은 더 이상 인터뷰 질문이 아니라 Project 필드이므로, brandName
  // 바로 뒤(index 0 다음)에 그 유형 전용 질문을 먼저 스플라이스한 뒤, 그
  // 확장된 목록을 기준으로 industry 위치를 다시 찾아 industry 전용 질문을
  // 스플라이스한다 -- 두 스플라이스는 순서대로 적용해야 인덱스가 어긋나지 않는다.
  const deliverableTypeExtra = matchDeliverableTypeQuestions(deliverableType);
  const withDeliverableType = [
    ...INTERVIEW_QUESTIONS.slice(0, 1),
    ...deliverableTypeExtra,
    ...INTERVIEW_QUESTIONS.slice(1),
  ];

  const industryAnswer = interview.answers.find((a) => a.questionKey === "industry")?.answer ?? "";
  const industryExtra = matchIndustryQuestions(industryAnswer);

  const industryIndex = withDeliverableType.findIndex((q) => q.key === "industry");
  const base = [
    ...withDeliverableType.slice(0, industryIndex + 1),
    ...industryExtra,
    ...withDeliverableType.slice(industryIndex + 1),
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
 * "기타(직접 입력)" 답변에서 자유 텍스트 부분만 뽑아낸다. 단일 선택은 답변
 * 전체가 `OTHER_ANSWER_PREFIX`로 시작하는지 보고, 다중 선택은 콤마로 나눈
 * 항목 중 하나가 그 접두사로 시작하는지 본다(다른 항목은 고정 보기라 절대
 * 이 접두사로 시작하지 않는다). "기타"를 고르지 않았으면 null.
 */
function extractOtherAnswerText(answer: string, multiple: boolean | undefined): string | null {
  const items = multiple ? answer.split(",").map((v) => v.trim()) : [answer.trim()];
  const otherItem = items.find((item) => item.startsWith(OTHER_ANSWER_PREFIX));
  return otherItem ? otherItem.slice(OTHER_ANSWER_PREFIX.length).trim() : null;
}

/**
 * Picks the weakest still-unprobed required answer (short answers read as
 * low-confidence). Already-followed-up questions are skipped so the same
 * gap is never asked about twice ("같은 질문 반복 금지").
 *
 * 두 가지를 검사한다: (1) 서술형(textarea) 답변이 너무 짧은 경우 (2) 객관식
 * 이지만 `allowOther`로 "기타(직접 입력)"를 고른 경우, 그 자유 입력 텍스트가
 * 너무 짧은 경우. 닫힌 보기를 그대로 고른 답변(브랜드명, 업종 등)은 원래
 * 짧은 게 정상이므로 검사하지 않는다.
 */
export function findWeakAnswer(
  questions: InterviewQuestionDef[],
  answers: InterviewAnswerRecord[],
): { key: string; text: string; answer: string } | null {
  for (const q of questions) {
    if (!q.required || q.key.startsWith(FOLLOW_UP_KEY_PREFIX)) continue;
    const checksTextarea = q.type === "textarea";
    const checksOther = q.type === "select" && q.allowOther === true;
    if (!checksTextarea && !checksOther) continue;

    const record = answers.find((a) => a.questionKey === q.key);
    if (!record?.answer) continue;

    const alreadyFollowedUp = answers.some(
      (a) => a.questionKey === `${FOLLOW_UP_KEY_PREFIX}${q.key}`,
    );
    if (alreadyFollowedUp) continue;

    if (checksTextarea) {
      if (record.answer.trim().length < WEAK_ANSWER_LENGTH_THRESHOLD) {
        return { key: q.key, text: q.text, answer: record.answer };
      }
      continue;
    }

    const otherText = extractOtherAnswerText(record.answer, q.multiple);
    if (otherText !== null && otherText.length < WEAK_ANSWER_LENGTH_THRESHOLD) {
      return { key: q.key, text: q.text, answer: otherText };
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
