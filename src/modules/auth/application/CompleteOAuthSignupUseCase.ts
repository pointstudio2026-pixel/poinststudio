import type { UserRepository } from "@/modules/auth/domain/UserRepository";
import type { OAuthAccountRepository, OAuthProviderCode } from "@/modules/auth/domain/OAuthAccountRepository";
import type { OAuthProfile } from "@/shared/oauth/OAuthProvider";
import { toPublicUser } from "@/modules/auth/application/publicUser";
import type { OAuthLoginOutput } from "@/modules/auth/application/OAuthLoginUseCase";
import type { TokenService } from "@/modules/auth/application/TokenService";
import { recordActivity } from "@/shared/activity/activityLogger";

export interface CompleteOAuthSignupInput {
  provider: OAuthProviderCode;
  profile: OAuthProfile;
}

/**
 * Creates the real account for a genuinely new OAuth sign-up -- only
 * reached after the user explicitly agreed on /oauth/consent (see
 * OAuthConsentRequiredError in OAuthLoginUseCase). Mirrors what
 * OAuthLoginUseCase used to do inline before that consent gate was added.
 */
export class CompleteOAuthSignupUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly oauthAccountRepository: OAuthAccountRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: CompleteOAuthSignupInput): Promise<OAuthLoginOutput> {
    const user = await this.userRepository.create({
      email: input.profile.email,
      name: input.profile.name ?? undefined,
      emailVerifiedAt: input.profile.emailVerified ? new Date() : undefined,
    });

    await this.oauthAccountRepository.create({
      userId: user.id,
      provider: input.provider,
      providerAccountId: input.profile.providerAccountId,
    });

    // RegisterUseCase의 agreedToTermsAt 증빙 패턴과 동일 -- /oauth/consent
    // 동의 화면을 실제로 거친 시점을 남긴다.
    await recordActivity({
      userId: user.id,
      eventType: "USER_REGISTERED",
      payload: { via: input.provider, agreedToTermsAt: new Date().toISOString() },
    });
    await this.userRepository.updateLastLogin(user.id);

    const tokens = await this.tokenService.issueTokenPair({
      id: user.id,
      role: user.role,
      adminTier: user.adminTier,
    });

    return { user: toPublicUser(user), ...tokens, isNewUser: true };
  }
}
