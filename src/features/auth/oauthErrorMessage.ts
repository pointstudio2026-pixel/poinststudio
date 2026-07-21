const MESSAGES: Record<string, string> = {
  not_configured: "아직 연결되지 않은 로그인 방식입니다.",
  invalid_request: "로그인 요청이 만료되었거나 올바르지 않습니다. 다시 시도해주세요.",
  failed: "로그인에 실패했습니다. 다시 시도해주세요.",
  no_account: "가입된 계정이 없습니다. 회원가입을 먼저 진행해주세요.",
};

export function oauthErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return MESSAGES[code] ?? "로그인 중 문제가 발생했습니다.";
}
