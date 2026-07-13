import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE } from "@/shared/auth/cookies";
import { verifyAccessToken, type AccessTokenPayload } from "@/shared/auth/jwt";
import { AuthenticationError } from "@/shared/errors/AppError";

/**
 * Auth middleware for Route Handlers: throws AuthenticationError (401) when
 * the request has no valid access token. Every protected Route Handler calls
 * this before invoking its Use Case.
 */
export function requireUser(request: NextRequest): AccessTokenPayload {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    throw new AuthenticationError("Authentication required", "AUTH-006");
  }
  return verifyAccessToken(token);
}

/**
 * Non-throwing variant for Server Components (e.g. redirecting to /login).
 */
export async function getCurrentSession(): Promise<AccessTokenPayload | null> {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

/**
 * Common Auth Guard for protected Server Component pages: redirects to
 * /login when there is no valid session, otherwise returns it. Every
 * protected page calls this instead of re-implementing the check.
 */
export async function requireSessionOrRedirect(): Promise<AccessTokenPayload> {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
