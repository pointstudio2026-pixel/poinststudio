import { apiFetch } from "@/services/http-client";

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: "designer" | "admin";
  createdAt: string;
}

export function registerUser(input: { email: string; password: string; name?: string }) {
  return apiFetch<{ user: PublicUser }>("/api/auth/register", {
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
  return apiFetch<{ user: PublicUser }>("/api/auth/me", { method: "GET" });
}
