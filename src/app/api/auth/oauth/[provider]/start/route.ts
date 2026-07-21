import { NextResponse, type NextRequest } from "next/server";
import { getOAuthProvider } from "@/shared/oauth/oauthRegistry";
import { OAUTH_INTENT_COOKIE, OAUTH_STATE_COOKIE } from "@/shared/auth/cookies";
import { generateOpaqueToken } from "@/shared/auth/opaqueToken";
import { resolveAppOrigin } from "@/shared/http/appOrigin";

const STATE_TTL_SECONDS = 600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const origin = resolveAppOrigin(request);
  const oauthProvider = getOAuthProvider(provider, origin);

  if (!oauthProvider) {
    return NextResponse.redirect(new URL("/login?oauthError=not_configured", origin));
  }

  // /login과 /register의 OAuth 버튼은 결과가 달라야 한다: 로그인 페이지는
  // 기존 계정 로그인 전용(새 계정을 만들지 않음), 회원가입 페이지만 신규
  // 가입 절차(consent 화면)로 이어진다 -- 콜백 시점에 원래 어느 페이지였는지
  // 알아야 하므로 state와 함께 짧은 쿠키로 들고 간다.
  const intentParam = new URL(request.url).searchParams.get("intent");
  const intent = intentParam === "login" ? "login" : "register";

  const state = generateOpaqueToken();
  const res = NextResponse.redirect(oauthProvider.getAuthorizationUrl(state));
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: STATE_TTL_SECONDS,
  };
  res.cookies.set(OAUTH_STATE_COOKIE, state, cookieOptions);
  res.cookies.set(OAUTH_INTENT_COOKIE, intent, cookieOptions);
  return res;
}
