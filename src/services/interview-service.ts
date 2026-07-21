import { apiFetch } from "@/services/http-client";

/** 서버(interviewQuestions.ts)와 동일한 접두사 -- "기타(직접 입력)" 답변을
 * 표시하는 sentinel. 도메인 모듈을 프론트에서 직접 import하지 않는 기존
 * 레이어 분리를 지키기 위해 이 얇은 문자열 상수만 별도로 둔다. */
export const OTHER_ANSWER_PREFIX = "기타: ";

/** 답변에서 "기타" 자유 입력 텍스트만 뽑아낸다. 선택 안 했으면 null. */
export function extractOtherAnswerText(answer: string, multiple: boolean | undefined): string | null {
  const items = multiple ? answer.split(",").map((v) => v.trim()) : [answer.trim()];
  const otherItem = items.find((item) => item.startsWith(OTHER_ANSWER_PREFIX));
  return otherItem ? otherItem.slice(OTHER_ANSWER_PREFIX.length).trim() : null;
}

export interface InterviewQuestionDto {
  key: string;
  text: string;
  type: "text" | "textarea" | "select";
  required: boolean;
  options?: string[];
  optionGroups?: { group: string; options: string[] }[];
  multiple?: boolean;
  allowOther?: boolean;
}

export interface InterviewAnswerDto {
  questionKey: string;
  questionText: string;
  answer: string | null;
  sequence: number;
}

export interface InterviewDto {
  id: string;
  projectId: string;
  status: "in_progress" | "completed";
  currentQuestionIndex: number;
  answers: InterviewAnswerDto[];
}

export interface InterviewStateDto {
  interview: InterviewDto;
  questions: InterviewQuestionDto[];
  readyToComplete: boolean;
}

export function fetchInterview(projectId: string) {
  return apiFetch<InterviewStateDto>(`/api/interview/${projectId}`);
}

export function saveInterviewAnswer(projectId: string, questionKey: string, answer: string) {
  return apiFetch<InterviewStateDto>("/api/interview/answer", {
    method: "POST",
    body: JSON.stringify({ projectId, questionKey, answer }),
  });
}

export function generateFollowUpQuestion(projectId: string) {
  return apiFetch<InterviewStateDto & { followUpGenerated: boolean }>(
    "/api/interview/follow-up",
    { method: "POST", body: JSON.stringify({ projectId }) },
  );
}

export function completeInterview(projectId: string) {
  return apiFetch<{ interview: InterviewDto }>("/api/interview/complete", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
}
