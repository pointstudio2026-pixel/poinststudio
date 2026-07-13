const ACTIVITY_LABELS: Record<string, string> = {
  USER_REGISTERED: "회원가입",
  USER_LOGGED_IN: "로그인",
  USER_LOGGED_OUT: "로그아웃",
  TOKEN_REFRESHED: "세션 갱신",
  PROJECT_CREATED: "프로젝트 생성",
};

export function activityLabel(eventType: string): string {
  return ACTIVITY_LABELS[eventType] ?? eventType;
}
