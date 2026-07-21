import type { OAuthProviderCode } from "@/modules/auth/domain/OAuthAccountRepository";

export interface OAuthProfile {
  providerAccountId: string;
  email: string;
  name: string | null;
  /** Whether the provider itself already confirmed this email address. */
  emailVerified: boolean;
}

export interface OAuthProvider {
  readonly name: OAuthProviderCode;
  /** Builds the URL the browser is redirected to, with `state` embedded for CSRF protection. */
  getAuthorizationUrl(state: string): string;
  /** Exchanges the one-time `code` from the callback for the user's profile. */
  exchangeCodeForProfile(code: string): Promise<OAuthProfile>;
}
