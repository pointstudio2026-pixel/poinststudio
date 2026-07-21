import type { OAuthProfile, OAuthProvider } from "@/shared/oauth/OAuthProvider";
import { ProviderError } from "@/shared/errors/AppError";

const AUTH_URL = "https://kauth.kakao.com/oauth/authorize";
const TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const USERINFO_URL = "https://kapi.kakao.com/v2/user/me";

interface KakaoTokenResponse {
  access_token: string;
}

interface KakaoUserInfo {
  id: number;
  kakao_account?: {
    email?: string;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    profile?: { nickname?: string };
  };
}

export class KakaoOAuthProvider implements OAuthProvider {
  readonly name = "kakao" as const;

  constructor(
    private readonly config: { clientId: string; clientSecret?: string; redirectUri: string },
  ) {}

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForProfile(code: string): Promise<OAuthProfile> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      code,
    });
    if (this.config.clientSecret) {
      body.set("client_secret", this.config.clientSecret);
    }

    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!tokenRes.ok) {
      throw new ProviderError("Kakao 로그인 토큰 교환에 실패했습니다.", await safeJson(tokenRes));
    }
    const { access_token: accessToken } = (await tokenRes.json()) as KakaoTokenResponse;

    const profileRes = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) {
      throw new ProviderError("Kakao 프로필 조회에 실패했습니다.", await safeJson(profileRes));
    }
    const profile = (await profileRes.json()) as KakaoUserInfo;

    // Kakao only returns an email when the app has the "카카오계정(이메일)"
    // consent item approved; without it, synthesize a stable placeholder so
    // account creation doesn't fail outright (documented as a known
    // limitation -- see project_aster_pending_user_items memory).
    const email = profile.kakao_account?.email ?? `kakao-${profile.id}@users.noreply.aster.dev`;
    const emailVerified = Boolean(
      profile.kakao_account?.email && profile.kakao_account.is_email_verified && profile.kakao_account.is_email_valid,
    );

    return {
      providerAccountId: String(profile.id),
      email,
      name: profile.kakao_account?.profile?.nickname ?? null,
      emailVerified,
    };
  }
}

async function safeJson(res: Response) {
  return res.json().catch(() => null);
}
