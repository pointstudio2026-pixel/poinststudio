const ACTIVITY_LABELS: Record<string, string> = {
  USER_REGISTERED: "회원가입",
  USER_LOGGED_IN: "로그인",
  USER_LOGGED_OUT: "로그아웃",
  TOKEN_REFRESHED: "세션 갱신",
  PROJECT_CREATED: "프로젝트 생성",
  PROJECT_UPDATED: "프로젝트 수정",
  PROJECT_DELETED: "프로젝트 삭제",
  BRAND_BRIEF_GENERATED: "Brand Brief 생성",
  BRAND_STRATEGY_GENERATED: "Brand Strategy 생성",
  BRAND_STRATEGY_REBUILT: "Brand Strategy 재분석",
  STYLE_SELECTED: "스타일 선택",
  PROMPT_BUILT: "Prompt 생성",
  GENERATION_REQUESTED: "이미지 생성 요청",
  GENERATION_COMPLETED: "이미지 생성 완료",
  GENERATION_FAILED: "이미지 생성 실패",
  GENERATION_RETRIED: "이미지 생성 재시도",
  EDIT_REQUESTED: "원클릭 수정 요청",
  EDIT_COMPLETED: "원클릭 수정 완료",
  EDIT_FAILED: "원클릭 수정 실패",
  EDIT_RETRIED: "원클릭 수정 재시도",
  CONCEPT_BOARD_GENERATED: "Concept Board 생성",
  CONCEPT_BOARD_UPDATED: "Concept Board 수정",
  CONCEPT_BOARD_RESTORED: "Concept Board 버전 복원",
  MOCKUP_REQUESTED: "목업 생성 요청",
  MOCKUP_COMPLETED: "목업 생성 완료",
  MOCKUP_FAILED: "목업 생성 실패",
};

export function activityLabel(eventType: string): string {
  return ACTIVITY_LABELS[eventType] ?? eventType;
}
