import { apiFetch } from "@/services/http-client";

export interface InterviewQuestionDto {
  key: string;
  text: string;
  type: "text" | "textarea";
  required: boolean;
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

export function fetchInterview(projectId: string) {
  return apiFetch<{ interview: InterviewDto; questions: InterviewQuestionDto[] }>(
    `/api/interview/${projectId}`,
  );
}

export function saveInterviewAnswer(projectId: string, questionKey: string, answer: string) {
  return apiFetch<{ interview: InterviewDto }>("/api/interview/answer", {
    method: "POST",
    body: JSON.stringify({ projectId, questionKey, answer }),
  });
}

export function completeInterview(projectId: string) {
  return apiFetch<{ interview: InterviewDto }>("/api/interview/complete", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
}
