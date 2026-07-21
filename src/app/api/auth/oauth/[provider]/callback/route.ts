import { NextResponse, type NextRequest } from "next/server";
import { getOAuthProvider } from "@/shared/oauth/oauthRegistry";
import { authContainer } from "@/modules/auth/container";
import { OAuthConsentRequiredError } from "@/modules/auth/application/OAuthLoginUseCase";
import {
  OAUTH_INTENT_COOKIE,
  OAUTH_STATE_COOKIE,
  setAuthCookies,
  setOAuthPendingSignupCookie,
} from "@/shared/auth/cookies";
import { signOAuthPendingSignupToken } from "@/shared/auth/jwt";
import { logger } from "@/shared/logging/logger";
import { resolveAppOrigin } from "@/shared/http/appOrigin";

function clearRoundTripCookies(res: NextResponse): void {
  res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(OAUTH_INTENT_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const origin = resolveAppOrigin(request);
  const loginErrorRedirect = (reason: string) => {
    const res = NextResponse.redirect(new URL(`/login?oauthError=${reason}`, origin));
    clearRoundTripCookies(res);
    return res;
  };

  const oauthProvider = getOAuthProvider(provider, origin);
  if (!oauthProvider) {
    return loginErrorRedirect("not_configured");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  // /login의 버튼은 로그인 전용, /register의 버튼만 신규 가입(consent 화면)으로
  // 이어진다 -- start route가 남긴 이 쿠키로 원래 어느 페이지였는지 구분한다.
  const intent = request.cookies.get(OAUTH_INTENT_COOKIE)?.value === "login" ? "login" : "register";

  if (!code || !state || !expectedState || state !== expectedState) {
    return loginErrorRedirect("invalid_request");
  }

  try {
    const profile = await oauthProvider.exchangeCodeForProfile(code);
    const result = await authContainer.oauthLoginUseCase.execute({
      provider: oauthProvider.name,
      profile,
    });

    // 기존 계정 로그인(재로그인 또는 인증된 이메일로 자동 연결)만 여기에
    // 도달한다 -- 진짜 신규 가입은 OAuthConsentRequiredError로 빠져나가
    // 아래 catch에서 별도 처리된다. "로그인하면 프로젝트가 아니라 로그인된
    // 상태로 메인페이지로" 요구사항에 맞춰 /projects가 아닌 /로 보낸다.
    const res = NextResponse.redirect(new URL("/", origin));
    setAuthCookies(res, result);
    clearRoundTripCookies(res);
    return res;
  } catch (err) {
    if (err instanceof OAuthConsentRequiredError) {
      if (intent === "login") {
        // 로그인 페이지에서는 계정이 없으면 조용히 새로 만들지 않고,
        // 회원가입을 먼저 하라고 안내한다.
        return loginErrorRedirect("no_account");
      }

      const pendingToken = signOAuthPendingSignupToken({
        provider: err.provider,
        providerAccountId: err.profile.providerAccountId,
        email: err.profile.email,
        emailVerified: err.profile.emailVerified,
        name: err.profile.name,
      });
      const res = NextResponse.redirect(new URL("/oauth/consent", origin));
      setOAuthPendingSignupCookie(res, pendingToken);
      clearRoundTripCookies(res);
      return res;
    }

    logger.error("OAuth callback failed", {
      errorCode: "OAUTH_CALLBACK_FAILED",
      provider,
      details: err instanceof Error ? err.message : String(err),
    });
    return loginErrorRedirect("failed");
  }
}
