import { randomBytes, createHash } from "node:crypto";

/** Raw, high-entropy token handed to the client (in the refresh cookie / body). */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}

/** Deterministic digest stored in the DB. The raw token itself is never persisted. */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
