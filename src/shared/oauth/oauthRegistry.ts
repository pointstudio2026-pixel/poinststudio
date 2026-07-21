import type { OAuthProviderCode } from "@/modules/auth/domain/OAuthAccountRepository";
import type { OAuthProvider } from "@/shared/oauth/OAuthProvider";
import { GoogleOAuthProvider } from "@/shared/oauth/GoogleOAuthProvider";
import { KakaoOAuthProvider } from "@/shared/oauth/KakaoOAuthProvider";

const SUPPORTED_PROVIDERS: OAuthProviderCode[] = ["google", "kakao"];

/**
 * Returns null when the provider name is unknown OR its credentials aren't
 * configured yet -- callers treat both cases the same way (redirect back
 * with a "not available" message) rather than crashing. `origin` is the
 * incoming request's own origin so the redirect URI always matches
 * whatever host/port the app is actually running on (no hardcoded env var
 * needed for local dev vs. production).
 */
export function getOAuthProvider(provider: string, origin: string): OAuthProvider | null {
  if (provider === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return new GoogleOAuthProvider({
      clientId,
      clientSecret,
      redirectUri: `${origin}/api/auth/oauth/google/callback`,
    });
  }
  if (provider === "kakao") {
    const clientId = process.env.KAKAO_CLIENT_ID;
    if (!clientId) return null;
    return new KakaoOAuthProvider({
      clientId,
      clientSecret: process.env.KAKAO_CLIENT_SECRET || undefined,
      redirectUri: `${origin}/api/auth/oauth/kakao/callback`,
    });
  }
  return null;
}

export function listAvailableOAuthProviders(): OAuthProviderCode[] {
  return SUPPORTED_PROVIDERS.filter((provider) => {
    if (provider === "google") return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    if (provider === "kakao") return Boolean(process.env.KAKAO_CLIENT_ID);
    return false;
  });
}
