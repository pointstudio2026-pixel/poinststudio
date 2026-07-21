import type { UserRepository } from "@/modules/auth/domain/UserRepository";
import type { PasswordHasher } from "@/modules/auth/domain/PasswordHasher";
import type { RegisterInput } from "@/modules/auth/schemas/auth.schemas";
import { toPublicUser, type PublicUser } from "@/modules/auth/application/publicUser";
import type { TokenService } from "@/modules/auth/application/TokenService";
import {
  emailVerificationTokenExpiry,
  generateEmailVerificationToken,
} from "@/modules/auth/domain/emailVerificationToken";
import type { EmailProvider } from "@/shared/email/EmailProvider";
import { buildVerificationEmail } from "@/modules/auth/application/verificationEmailTemplate";
import { recordActivity } from "@/shared/activity/activityLogger";
import { logger } from "@/shared/logging/logger";
import { ConflictError } from "@/shared/errors/AppError";

export interface RegisterOutput {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly emailProvider: EmailProvider,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("이미 사용 중인 이메일입니다.", "EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
      name: input.name,
    });

    // 약관 동의 시점 증빙 -- registerSchema가 agreedToTerms=true를 이미
    // 강제하므로 여기 도달했다는 것 자체가 동의했다는 뜻이지만, 나중에
    // 분쟁이 생기면 대조할 수 있도록 타임스탬프를 남긴다.
    await recordActivity({ userId: user.id, eventType: "USER_REGISTERED", payload: { agreedToTermsAt: new Date().toISOString() } });

    const token = generateEmailVerificationToken();
    await this.userRepository.setEmailVerificationToken(user.id, token, emailVerificationTokenExpiry());
    // 발송 실패가 회원가입 자체를 실패시키면 안 된다 -- recordActivity와 동일한
    // best-effort 원칙(재발송 버튼으로 나중에 다시 시도할 수 있다).
    try {
      await this.emailProvider.send(buildVerificationEmail(user.email, token));
    } catch (err) {
      logger.error("Failed to send verification email", {
        userId: user.id,
        details: err instanceof Error ? err.message : String(err),
      });
    }

    const tokens = await this.tokenService.issueTokenPair({ id: user.id, role: user.role });

    return { user: toPublicUser(user), ...tokens };
  }
}
