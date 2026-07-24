import type { VisionEvaluationResult } from "@/modules/generations/domain/visionEvaluation";

export interface GenerationEvaluation {
  id: string;
  generationVersionId: string;
  /** "PROMPT_LEVEL_ONLY" -- 이미지 자체는 검증하지 않았다는 걸 명시. Vision 판단이 끝나면 "VISION_VERIFIED"로 갱신된다. */
  status: string;
  hardConstraintPassed: boolean;
  issues: string[];
  usageScore: number | null;
  /** Vision AI(GPT) 판단 점수 -- 아직 판단 전이거나 실패했으면 null. */
  visionScore: number | null;
  visionEvaluation: VisionEvaluationResult | null;
  promotedToReference: boolean;
  createdAt: Date;
}

export interface CreateGenerationEvaluationInput {
  generationVersionId: string;
  status: string;
  hardConstraintPassed: boolean;
  issues: string[];
}
