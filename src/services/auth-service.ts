export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: "designer" | "admin";
  createdAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!body.success || !body.data) {
    throw new Error(body.error?.message ?? "요청을 처리하지 못했습니다.");
  }
  return body.data;
}

export function registerUser(input: { email: string; password: string; name?: string }) {
  return request<{ user: PublicUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginUser(input: { email: string; password: string }) {
  return request<{ user: PublicUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logoutUser() {
  return request<{ loggedOut: boolean }>("/api/auth/logout", { method: "POST" });
}

export function fetchCurrentUser() {
  return request<{ user: PublicUser }>("/api/auth/me", { method: "GET" });
}
