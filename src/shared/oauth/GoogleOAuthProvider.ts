import type { OAuthProfile, OAuthProvider } from "@/shared/oauth/OAuthProvider";
import { ProviderError } from "@/shared/errors/AppError";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

interface GoogleTokenResponse {
  access_token: string;
}

interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

export class GoogleOAuthProvider implements OAuthProvider {
  readonly name = "google" as const;

  constructor(
    private readonly config: { clientId: string; clientSecret: string; redirectUri: string },
  ) {}

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "online",
      prompt: "select_account",
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForProfile(code: string): Promise<OAuthProfile> {
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      throw new ProviderError("Google 로그인 토큰 교환에 실패했습니다.", await safeJson(tokenRes));
    }
    const { access_token: accessToken } = (await tokenRes.json()) as GoogleTokenResponse;

    const profileRes = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) {
      throw new ProviderError("Google 프로필 조회에 실패했습니다.", await safeJson(profileRes));
    }
    const profile = (await profileRes.json()) as GoogleUserInfo;
    if (!profile.email) {
      throw new ProviderError("Google 계정에서 이메일을 가져오지 못했습니다.");
    }

    return {
      providerAccountId: profile.sub,
      email: profile.email,
      name: profile.name ?? null,
      emailVerified: profile.email_verified ?? false,
    };
  }
}

async function safeJson(res: Response) {
  return res.json().catch(() => null);
}
