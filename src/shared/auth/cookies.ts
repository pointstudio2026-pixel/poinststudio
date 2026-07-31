import type { NextResponse } from "next/server";
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from "@/shared/auth/constants";

export const ACCESS_TOKEN_COOKIE = "aster_access_token";
export const REFRESH_TOKEN_COOKIE = "aster_refresh_token";
/** Short-lived CSRF guard for the OAuth redirect round-trip (see /api/auth/oauth/[provider]). */
export const OAUTH_STATE_COOKIE = "aster_oauth_state";
/** Remembers whether the OAuth button was clicked from /login or /register, across the redirect round-trip. */
export const OAUTH_INTENT_COOKIE = "aster_oauth_intent";
/** Optional post-auth destination (e.g. a guide article's "시작하기" CTA wants /projects even for a returning user), carried across the redirect round-trip the same way as intent/state. */
export const OAUTH_REDIRECT_COOKIE = "aster_oauth_redirect";
/** Holds the signed OAuthPendingSignupPayload while a new sign-up is on /oauth/consent. */
export const OAUTH_PENDING_SIGNUP_COOKIE = "aster_oauth_pending_signup";
const OAUTH_PENDING_SIGNUP_TTL_SECONDS = 10 * 60;
/**
 * 비로그인 "목업" 단독 프로세스용 게스트 상관관계 ID -- 인증 쿠키와
 * 완전히 별개(로그인 상태를 뜻하지 않음, 그냥 crypto.randomUUID() 값
 * 하나). 3회 무료 한도 카운팅과 회원가입 시 이전(claim)에만 쓰인다.
 */
export const GUEST_ID_COOKIE = "aster_guest_id";
const GUEST_ID_TTL_SECONDS = 60 * 60 * 24 * 365;

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function setAuthCookies(
  res: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
): void {
  res.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOptions(),
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });
  res.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions(),
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_TOKEN_COOKIE, "", { ...baseCookieOptions(), maxAge: 0 });
  res.cookies.set(REFRESH_TOKEN_COOKIE, "", { ...baseCookieOptions(), maxAge: 0 });
}

export function setOAuthPendingSignupCookie(res: NextResponse, token: string): void {
  res.cookies.set(OAUTH_PENDING_SIGNUP_COOKIE, token, {
    ...baseCookieOptions(),
    maxAge: OAUTH_PENDING_SIGNUP_TTL_SECONDS,
  });
}

export function clearOAuthPendingSignupCookie(res: NextResponse): void {
  res.cookies.set(OAUTH_PENDING_SIGNUP_COOKIE, "", { ...baseCookieOptions(), maxAge: 0 });
}

export function setGuestIdCookie(res: NextResponse, guestId: string): void {
  res.cookies.set(GUEST_ID_COOKIE, guestId, { ...baseCookieOptions(), maxAge: GUEST_ID_TTL_SECONDS });
}

export function clearGuestIdCookie(res: NextResponse): void {
  res.cookies.set(GUEST_ID_COOKIE, "", { ...baseCookieOptions(), maxAge: 0 });
}
