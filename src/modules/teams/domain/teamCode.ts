import { randomInt } from "node:crypto";

/** 6-digit numeric join code, e.g. "004821". Uniqueness is enforced by the DB, not here. */
export function generateTeamCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}
