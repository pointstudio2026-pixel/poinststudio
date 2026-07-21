import type { EmailProvider, SendEmailInput } from "@/shared/email/EmailProvider";
import { logger } from "@/shared/logging/logger";

/**
 * 실제 이메일 발송 서비스 키(RESEND_API_KEY)가 없을 때 쓰는 폴백 -- 콘솔
 * 로그로 수신자/제목/본문을 그대로 남겨 개발 중에도 인증 링크를 바로 확인할
 * 수 있다. MockImageGenerationProvider/MockTextCompletionProvider와 동일한
 * "키 없어도 전체 흐름이 끊기지 않는다" 원칙.
 */
export class MockEmailProvider implements EmailProvider {
  readonly name = "mock";

  async send(input: SendEmailInput): Promise<void> {
    logger.info("Mock email send (no RESEND_API_KEY configured)", {
      provider: this.name,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
  }
}
