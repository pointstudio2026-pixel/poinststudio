import type { TrainingExample, TrainingExampleEvaluationBreakdownEntry } from "@/modules/trainingExamples/domain/TrainingExample";

export interface CreateTrainingExampleInput {
  prompt: string;
  deliverableType: string;
  imageStorageKey: string;
  imageContentType: string;
  createdByUserId: string;
  evaluationScore?: number | null;
  evaluationBreakdown?: Record<string, TrainingExampleEvaluationBreakdownEntry> | null;
  evaluatedAt?: Date | null;
  source?: string;
  sourceGenerationVersionId?: string | null;
  category?: string;
  industry?: string | null;
}

export interface TrainingExampleRepository {
  create(input: CreateTrainingExampleInput): Promise<TrainingExample>;
  list(): Promise<TrainingExample[]>;
  /** category 지정 시 그 카테고리로만 필터(이미지생성 파이프라인이 목업 자료를, 또는 그 반대를 절대 안 읽도록). */
  listByDeliverableType(deliverableType: string, category?: string): Promise<TrainingExample[]>;
  findById(id: string): Promise<TrainingExample | null>;
  delete(id: string): Promise<void>;
  /** 낮은 점수부터 초과분만큼 삭제 -- DB 용량 관리(§6). */
  deleteLowestScoring(count: number): Promise<number>;
}
