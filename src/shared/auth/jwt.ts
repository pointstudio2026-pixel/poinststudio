import jwt from "jsonwebtoken";
import { AuthenticationError } from "@/shared/errors/AppError";
import { ACCESS_TOKEN_TTL_SECONDS } from "@/shared/auth/constants";

export type UserRole = "designer" | "admin";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  type: "access";
}

function requireAccessSecret(): string {
  const value = process.env.JWT_ACCESS_SECRET;
  if (!value) {
    throw new Error("Missing required environment variable: JWT_ACCESS_SECRET");
  }
  return value;
}

export function signAccessToken(payload: { sub: string; role: UserRole }): string {
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
