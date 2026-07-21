import jwt from "jsonwebtoken";
import { AuthenticationError } from "@/shared/errors/AppError";
import { ACCESS_TOKEN_TTL_SECONDS } from "@/shared/auth/constants";
import type { OAuthProviderCode } from "@/modules/auth/domain/OAuthAccountRepository";

export type UserRole = "designer" | "admin";
export type AdminTier = "super_admin" | "manager" | "support";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  /** role이 "admin"일 때만 의미 있음. */
  adminTier?: AdminTier;
  type: "access";
}

const OAUTH_PENDING_SIGNUP_TTL_SECONDS = 10 * 60;

export interface OAuthPendingSignupPayload {
  provider: OAuthProviderCode;
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  type: "oauth_pending_signup";
}

function requireAccessSecret(): string {
  const value = process.env.JWT_ACCESS_SECRET;
  if (!value) {
    throw new Error("Missing required environment variable: JWT_ACCESS_SECRET");
  }
  return value;
}

export function signAccessToken(payload: { sub: string; role: UserRole; adminTier?: AdminTier }): string {
  const body: AccessTokenPayload = { ...payload, type: "access" };
  return jwt.sign(body, requireAccessSecret(), { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, requireAccessSecret());
    if (typeof decoded === "string" || decoded.type !== "access") {
      throw new AuthenticationError("Invalid access token", "AUTH-006");
    }
    return decoded as AccessTokenPayload;
  } catch {
    throw new AuthenticationError("Invalid or expired access token", "AUTH-006");
  }
}

/**
 * 신규 OAuth 가입자가 약관 동의 화면(/oauth/consent)을 거치는 동안 아직
 * 계정을 만들지 않은 상태로 프로필을 잠깐 들고 있기 위한 토큰 --
 * signAccessToken과 시크릿을 공유하지만 `type`이 달라 access token으로는
 * 절대 쓰일 수 없다.
 */
export function signOAuthPendingSignupToken(
  payload: Omit<OAuthPendingSignupPayload, "type">,
): string {
  const body: OAuthPendingSignupPayload = { ...payload, type: "oauth_pending_signup" };
  return jwt.sign(body, requireAccessSecret(), { expiresIn: OAUTH_PENDING_SIGNUP_TTL_SECONDS });
}

export function verifyOAuthPendingSignupToken(token: string): OAuthPendingSignupPayload {
  try {
    const decoded = jwt.verify(token, requireAccessSecret());
    if (typeof decoded === "string" || decoded.type !== "oauth_pending_signup") {
      throw new AuthenticationError("Invalid pending signup token", "AUTH-012");
    }
    return decoded as OAuthPendingSignupPayload;
  } catch {
    throw new AuthenticationError("가입 절차가 만료되었습니다. 다시 로그인해주세요.", "AUTH-012");
  }
}
