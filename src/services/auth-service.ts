import { apiFetch } from "@/services/http-client";

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: "designer" | "admin";
  adminTier: "super_admin" | "manager" | "support" | null;
  createdAt: string;
  hasPassword: boolean;
  emailVerified: boolean;
}

export function registerUser(input: { email: string; password: string; name?: string; agreedToTerms: boolean }) {
  return apiFetch<{ user: PublicUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function completeOAuthSignup(input: { agreedToTerms: boolean }) {
  return apiFetch<{ user: PublicUser }>("/api/auth/oauth/consent", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginUser(input: { email: string; password: string }) {
  return apiFetch<{ user: PublicUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logoutUser() {
  return apiFetch<{ loggedOut: boolean }>("/api/auth/logout", { method: "POST" });
}

export function fetchCurrentUser() {
  // A 401 here just means "not logged in yet" (e.g. a first-time visitor on
  // a public page like /register) — it must not force-navigate to /login.
  return apiFetch<{ user: PublicUser }>("/api/auth/me", { method: "GET", skipAuthRedirect: true });
}

export function updateProfile(input: { name: string }) {
  return apiFetch<{ user: PublicUser }>("/api/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function changePassword(input: { currentPassword: string; newPassword: string }) {
  return apiFetch<{ ok: boolean }>("/api/auth/password", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function verifyEmail(token: string) {
  return apiFetch<{ ok: boolean }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resendVerificationEmail() {
  return apiFetch<{ ok: boolean }>("/api/auth/resend-verification", { method: "POST" });
}
