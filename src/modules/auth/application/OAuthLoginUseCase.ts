import type { UserRepository } from "@/modules/auth/domain/UserRepository";
import type { OAuthAccountRepository, OAuthProviderCode } from "@/modules/auth/domain/OAuthAccountRepository";
import type { OAuthProfile } from "@/shared/oauth/OAuthProvider";
import { toPublicUser, type PublicUser } from "@/modules/auth/application/publicUser";
import type { TokenService } from "@/modules/auth/application/TokenService";
import { recordActivity } from "@/shared/activity/activityLogger";
import { AuthenticationError, InternalError } from "@/shared/errors/AppError";

export interface OAuthLoginInput {
  provider: OAuthProviderCode;
  profile: OAuthProfile;
}

export interface OAuthLoginOutput {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

/**
 * Signals that no existing account matched this OAuth profile -- a real
 * account must not be silently auto-created (that skipped the ToS consent
 * every other sign-up path requires). The callback route catches this and
 * redirects to /oauth/consent; CompleteOAuthSignupUseCase does the actual
 * account creation once the user explicitly agrees.
 */
export class OAuthConsentRequiredError extends Error {
  constructor(
    public readonly provider: OAuthProviderCode,
    public readonly profile: OAuthProfile,
  ) {
    super("OAuth sign-up requires explicit consent");
    this.name = "OAuthConsentRequiredError";
  }
}

/**
 * Resolves an already-verified OAuth profile (see GoogleOAuthProvider /
 * KakaoOAuthProvider) into a session: reuse the linked account if one
 * exists, or auto-link to an existing password account with the same
 * *provider-verified* email (that account already went through consent at
 * password registration). A profile matching neither is a genuinely new
 * sign-up, which this use case refuses to auto-create -- see
 * OAuthConsentRequiredError. Kept separate from the HTTP token-exchange
 * step so this business logic is unit-testable without calling out to
 * Google/Kakao.
 */
export class OAuthLoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly oauthAccountRepository: OAuthAccountRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: OAuthLoginInput): Promise<OAuthLoginOutput> {
    const existingAccount = await this.oauthAccountRepository.findByProviderAccount(
      input.provider,
      input.profile.providerAccountId,
    );

    let user = existingAccount ? await this.userRepository.findById(existingAccount.userId) : null;

    if (!user) {
      if (existingAccount) {
        // The linked account row exists but its user was deleted -- treat
        // this as a fresh sign-up rather than crashing.
        throw new InternalError("연결된 계정을 찾을 수 없습니다.");
      }

      // Only auto-link to an existing password account when the provider
      // itself has confirmed the email -- an unverified email must not let
      // someone silently take over another person's account. That existing
      // account already agreed to terms when it registered, so no new
      // consent is needed here.
      const existingByEmail = input.profile.emailVerified
        ? await this.userRepository.findByEmail(input.profile.email)
        : null;

      if (!existingByEmail) {
        // Genuinely new sign-up -- do not auto-create the account here.
        // CompleteOAuthSignupUseCase does that only after explicit consent.
        throw new OAuthConsentRequiredError(input.provider, input.profile);
      }

      user = existingByEmail;
      await this.oauthAccountRepository.create({
        userId: user.id,
        provider: input.provider,
        providerAccountId: input.profile.providerAccountId,
      });
    }

    if (user.deletedAt) {
      throw new AuthenticationError("삭제된 계정입니다.", "AUTH-010");
    }
    if (user.suspendedAt) {
      throw new AuthenticationError("정지된 계정입니다. 문의를 통해 확인해주세요.", "AUTH-011");
    }

    await recordActivity({
      userId: user.id,
      eventType: "USER_LOGGED_IN",
      payload: { via: input.provider },
    });
    await this.userRepository.updateLastLogin(user.id);

    const tokens = await this.tokenService.issueTokenPair({
      id: user.id,
      role: user.role,
      adminTier: user.adminTier,
    });

    return { user: toPublicUser(user), ...tokens, isNewUser: false };
  }
}
