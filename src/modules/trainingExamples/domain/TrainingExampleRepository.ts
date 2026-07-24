import type { TrainingExample, TrainingExampleEvaluationBreakdownEntry } from "@/modules/trainingExamples/domain/TrainingExample";

export interface CreateTrainingExampleInput {
  prompt: string;
  deliverableType: string;
  /** ADMIN 소스는 필수(애플리케이션 레벨 검증), USER_GENERATION 승격분은 생략(이미지 저장 안 함). */
  imageStorageKey?: string | null;
  imageContentType?: string | null;
  createdByUserId: string;
  evaluationScore?: number | null;
  evaluationBreakdown?: Record<string, TrainingExampleEvaluationBreakdownEntry> | null;
  evaluatedAt?: Date | null;
  source?: string;
  sourceGenerationVersionId?: string | null;
  category?: string;
  industry?: string | null;
}

export type TrainingExampleScoreBucket = "above" | "below";

export interface ListTrainingExampleCandidatesInput {
  deliverableType: string;
  category: string;
  /** 지정 시 이 업종이거나 업종 미지정인 것만(DB 레벨 필터, 성능 핵심). */
  industry?: string;
  /** "above" = evaluationScore >= threshold(참고용), "below" = evaluationScore < threshold(회피용, null 제외). */
  bucket: TrainingExampleScoreBucket;
  threshold: number;
  /** 데이터가 아무리 쌓여도 조회 비용이 일정하게 유지되도록 상한. */
  limit: number;
}

export interface TrainingExampleRepository {
  create(input: CreateTrainingExampleInput): Promise<TrainingExample>;
  list(): Promise<TrainingExample[]>;
  /** category 지정 시 그 카테고리로만 필터(이미지생성 파이프라인이 목업 자료를, 또는 그 반대를 절대 안 읽도록). */
  listByDeliverableType(deliverableType: string, category?: string): Promise<TrainingExample[]>;
  /** 실제 프롬프트 조립 시점의 조회 -- 작업물유형+카테고리+업종을 DB 레벨에서 걸러내고 상한(limit)까지 적용한다. */
  listCandidates(input: ListTrainingExampleCandidatesInput): Promise<TrainingExample[]>;
  findById(id: string): Promise<TrainingExample | null>;
  delete(id: string): Promise<void>;
  /** evaluationScore >= threshold인 것들이 capacity를 넘으면, 그중 낮은 점수부터 초과분 삭제. */
  pruneAboveThreshold(threshold: number, capacity: number): Promise<number>;
  /** evaluationScore < threshold(null 제외)인 것들이 capacity를 넘으면, 그중 높은(threshold에 가까운) 점수부터 초과분 삭제 -- 사용자 결정: 명확히 나쁜 사례일수록 회피 지침으로서 가치가 크다. */
  pruneBelowThreshold(threshold: number, capacity: number): Promise<number>;
}
