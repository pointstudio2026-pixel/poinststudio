import type { UserRepository } from "@/modules/auth/domain/UserRepository";
import type { EmailProvider } from "@/shared/email/EmailProvider";
import {
  emailVerificationTokenExpiry,
  generateEmailVerificationToken,
} from "@/modules/auth/domain/emailVerificationToken";
import { buildVerificationEmail } from "@/modules/auth/application/verificationEmailTemplate";
import { AuthenticationError } from "@/shared/errors/AppError";

export class ResendVerificationEmailUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailProvider: EmailProvider,
  ) {}

  async execute(input: { userId: string }): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new AuthenticationError("사용자를 찾을 수 없습니다.", "AUTH-006");
    }
    // 이미 인증된 계정이 재발송을 눌러도 에러 없이 조용히 성공 처리한다(멱등).
    if (user.emailVerifiedAt) {
      return;
    }

    const token = generateEmailVerificationToken();
    await this.userRepository.setEmailVerificationToken(user.id, token, emailVerificationTokenExpiry());
    await this.emailProvider.send(buildVerificationEmail(user.email, token));
  }
}
