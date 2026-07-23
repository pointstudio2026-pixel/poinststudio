/**
 * 우선순위 6단계(문서화 목적). Phase 1은 USER_HARD_CONSTRAINT와
 * DATABASE_PATTERN(TrainingExample)만 실제 데이터 소스를 갖는다 --
 * SAVED_BRAND_PROFILE(프로젝트 간 저장되는 브랜드 프로필)은 기존 분석
 * 결과 existing analog 없음(designMemory는 통계일 뿐 제약조건이 아님),
 * GENERAL_AI_SUGGESTION은 현재 파이프라인이 순수 AI 자유 추천을 실제
 * 프롬프트에 직접 반영하는 지점이 없어(BrandStrategy의 추천 색상 등은
 * ColorPaletteSelection으로 대체됨) 해당 없음. 둘 다 향후 확장 지점으로
 * 남겨둔다.
 */
export const PRIORITY_TIERS = [
  "USER_HARD_CONSTRAINT",
  "SAVED_BRAND_PROFILE",
  "USER_PREFERENCE",
  "EXPERT_RULE",
  "DATABASE_PATTERN",
  "GENERAL_AI_SUGGESTION",
] as const;

export type PriorityTier = (typeof PRIORITY_TIERS)[number];
