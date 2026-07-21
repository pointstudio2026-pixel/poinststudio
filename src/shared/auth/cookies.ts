import type { NextResponse } from "next/server";
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from "@/shared/auth/constants";

export const ACCESS_TOKEN_COOKIE = "aster_access_token";
export const REFRESH_TOKEN_COOKIE = "aster_refresh_token";
/** Short-lived CSRF guard for the OAuth redirect round-trip (see /api/auth/oauth/[provider]). */
export const OAUTH_STATE_COOKIE = "aster_oauth_state";
/** Remembers whether the OAuth button was clicked from /login or /register, across the redirect round-trip. */
export const OAUTH_INTENT_COOKIE = "aster_oauth_intent";
/** Holds the signed OAuthPendingSignupPayload while a new sign-up is on /oauth/consent. */
export const OAUTH_PENDING_SIGNUP_COOKIE = "aster_oauth_pending_signup";
const OAUTH_PENDING_SIGNUP_TTL_SECONDS = 10 * 60;

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
