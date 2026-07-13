import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import type { Interview } from "@/modules/interviews/domain/Interview";
import { ConflictError } from "@/shared/errors/AppError";

/**
 * Shared by SaveAnswerUseCase/CompleteInterviewUseCase: reuses the active
 * (in_progress) interview, transparently starts a new one if none exists
 * yet, but refuses to reopen one that's already completed.
 */
export async function getOrCreateActiveInterview(
  interviewRepository: InterviewRepository,
  projectId: string,
): Promise<Interview> {
  const active = await interviewRepository.findActiveByProjectId(projectId);
  if (active) return active;

  const latest = await interviewRepository.findLatestByProjectId(projectId);
  if (latest?.status === "completed") {
    throw new ConflictError("인터뷰가 이미 완료되었습니다.", "INTERVIEW_ALREADY_COMPLETED");
  }

  return interviewRepository.create(projectId);
}
