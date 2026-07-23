export interface GenerationEvaluation {
  id: string;
  generationVersionId: string;
  /** "PROMPT_LEVEL_ONLY" -- 이미지 자체는 검증하지 않았다는 걸 명시. */
  status: string;
  hardConstraintPassed: boolean;
  issues: string[];
  usageScore: number | null;
  promotedToReference: boolean;
  createdAt: Date;
}

export interface CreateGenerationEvaluationInput {
  generationVersionId: string;
  status: string;
  hardConstraintPassed: boolean;
  issues: string[];
}
