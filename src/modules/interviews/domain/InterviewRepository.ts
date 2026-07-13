import type { Interview } from "@/modules/interviews/domain/Interview";

export interface InterviewRepository {
  findActiveByProjectId(projectId: string): Promise<Interview | null>;
  /** Most recent interview regardless of status (in_progress or completed). */
  findLatestByProjectId(projectId: string): Promise<Interview | null>;
  create(projectId: string): Promise<Interview>;
  saveAnswer(
    interviewId: string,
    answer: { questionKey: string; questionText: string; answer: string; sequence: number },
  ): Promise<void>;
  updateCurrentQuestionIndex(interviewId: string, index: number): Promise<void>;
  complete(interviewId: string): Promise<Interview>;
}
