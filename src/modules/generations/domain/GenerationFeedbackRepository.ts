import type { GenerationFeedback, SubmitGenerationFeedbackInput } from "@/modules/generations/domain/GenerationFeedback";

export interface GenerationFeedbackRepository {
  /** generationVersionId당 1건 -- 재제출하면 덮어쓴다(사용자가 태그를 눌렀다 뗐다 해도 계속 최신 상태로 저장). */
  upsert(input: SubmitGenerationFeedbackInput): Promise<GenerationFeedback>;
  findByGenerationVersionId(generationVersionId: string): Promise<GenerationFeedback | null>;
}
