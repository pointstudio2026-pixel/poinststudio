import { randomBytes } from "node:crypto";

export const EMAIL_VERIFICATION_TOKEN_TTL_HOURS = 24;

export function generateEmailVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export function emailVerificationTokenExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + EMAIL_VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);
}
