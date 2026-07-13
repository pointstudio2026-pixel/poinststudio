import jwt from "jsonwebtoken";
import { AuthenticationError } from "@/shared/errors/AppError";

export type UserRole = "designer" | "admin";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  type: "refresh";
}

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

function requireSecret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function signAccessToken(payload: { sub: string; role: UserRole }): string {
  const body: AccessTokenPayload = { ...payload, type: "access" };
  return jwt.sign(body, requireSecret("JWT_ACCESS_SECRET"), { expiresIn: ACCESS_TOKEN_TTL });
}

export function signRefreshToken(payload: { sub: string }): string {
  const body: RefreshTokenPayload = { ...payload, type: "refresh" };
  return jwt.sign(body, requireSecret("JWT_REFRESH_SECRET"), { expiresIn: REFRESH_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, requireSecret("JWT_ACCESS_SECRET"));
    if (typeof decoded === "string" || decoded.type !== "access") {
      throw new AuthenticationError("Invalid access token", "AUTH-006");
    }
    return decoded as AccessTokenPayload;
  } catch {
    throw new AuthenticationError("Invalid or expired access token", "AUTH-006");
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, requireSecret("JWT_REFRESH_SECRET"));
    if (typeof decoded === "string" || decoded.type !== "refresh") {
      throw new AuthenticationError("Invalid refresh token", "AUTH-007");
    }
    return decoded as RefreshTokenPayload;
  } catch {
    throw new AuthenticationError("Invalid or expired refresh token", "AUTH-007");
  }
}
