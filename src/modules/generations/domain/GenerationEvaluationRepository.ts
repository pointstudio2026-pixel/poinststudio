import type { CreateGenerationEvaluationInput, GenerationEvaluation } from "@/modules/generations/domain/GenerationEvaluation";

export interface GenerationEvaluationRepository {
  create(input: CreateGenerationEvaluationInput): Promise<GenerationEvaluation>;
  findByGenerationVersionId(generationVersionId: string): Promise<GenerationEvaluation | null>;
  /** usageScore/promotedToReference 갱신 -- §6 DB 승격 관리자 액션에서 쓴다. */
  updateUsageScore(id: string, usageScore: number, promotedToReference: boolean): Promise<GenerationEvaluation>;
  /** 아직 usageScore가 없는(=아직 평가 안 된) 완료 생성 목록 -- 관리자 "평가 후 DB 반영" 액션이 대상으로 삼는다. */
  listUnscored(limit: number): Promise<GenerationEvaluation[]>;
}
