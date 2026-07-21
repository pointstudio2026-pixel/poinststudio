import type { EmailProvider } from "@/shared/email/EmailProvider";
import { MockEmailProvider } from "@/shared/email/MockEmailProvider";
import { ResendEmailProvider } from "@/shared/email/ResendEmailProvider";

/**
 * textCompletionRouter.ts/imageGenerationRouter.ts와 동일한 Provider Router
 * 패턴 -- RESEND_API_KEY가 없으면 Mock으로 폴백해 이메일 인증 흐름 전체가
 * 키 없이도 끊기지 않는다.
 */
export function resolveEmailProvider(): EmailProvider {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    return new ResendEmailProvider(resendKey, process.env.EMAIL_FROM_ADDRESS || undefined);
  }
  return new MockEmailProvider();
}
