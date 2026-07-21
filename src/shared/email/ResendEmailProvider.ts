import type { EmailProvider, SendEmailInput } from "@/shared/email/EmailProvider";
import { ProviderError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logging/logger";

const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "ASTER <onboarding@resend.dev>";

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  constructor(
    private readonly apiKey: string,
    private readonly fromAddress: string = DEFAULT_FROM,
  ) {}

  async send(input: SendEmailInput): Promise<void> {
    const start = Date.now();
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        from: this.fromAddress,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("Resend email send failed", {
        provider: this.name,
        status: res.status,
        duration: Date.now() - start,
        body,
      });
      throw new ProviderError(`이메일 발송 요청이 실패했습니다 (${res.status})`, { body });
    }
  }
}
