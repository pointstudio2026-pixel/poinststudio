import type { SendEmailInput } from "@/shared/email/EmailProvider";

/** RegisterUseCase에는 HTTP request가 없어 origin을 읽을 수 없으므로 env로 처리한다. */
function appBaseUrl(): string {
  return process.env.APP_BASE_URL || "http://localhost:3100";
}

export function buildVerificationEmail(to: string, token: string): SendEmailInput {
  const link = `${appBaseUrl()}/verify-email?token=${token}`;
  return {
    to,
    subject: "ASTER 이메일 인증을 완료해주세요",
    html:
      `<p>ASTER 가입을 환영합니다.</p>` +
      `<p>아래 링크를 클릭해 이메일 인증을 완료해주세요(24시간 내 만료):</p>` +
      `<p><a href="${link}">${link}</a></p>`,
  };
}
