import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { GET as meHandler } from "@/app/api/auth/me/route";

const TEST_EMAIL_PREFIX = "task002-route";

function uniqueEmail() {
  return `${TEST_EMAIL_PREFIX}-${Date.now()}-${Math.random().toString(16).slice(2)}@aster.dev`;
}

function jsonRequest(path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function cookieHeader(response: Response) {
  const cookies = (response as unknown as { cookies: { getAll(): { name: string; value: string }[] } })
    .cookies.getAll();
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
});

describe("Auth API routes", () => {
  it("register -> me -> logout -> me(401) flow", async () => {
    const email = uniqueEmail();

    const registerRes = await registerHandler(
      jsonRequest("/api/auth/register", { email, password: "password123" }),
    );
    expect(registerRes.status).toBe(201);
    const cookies = cookieHeader(registerRes);
    expect(cookies).toContain("aster_access_token=");

    const meRes = await meHandler(
      new NextRequest("http://localhost/api/auth/me", {
        headers: { cookie: cookies },
      }),
    );
    const meBody = await meRes.json();
    expect(meRes.status).toBe(200);
    expect(meBody.data.user.email).toBe(email);

    const logoutRes = await logoutHandler(
      new NextRequest("http://localhost/api/auth/logout", {
        method: "POST",
        headers: { cookie: cookies },
      }),
    );
    expect(logoutRes.status).toBe(200);

    const unauthedRes = await meHandler(
      new NextRequest("http://localhost/api/auth/me"),
    );
    expect(unauthedRes.status).toBe(401);
  });

  it("login fails with a wrong password (AUTH-002)", async () => {
    const email = uniqueEmail();
    await registerHandler(jsonRequest("/api/auth/register", { email, password: "password123" }));

    const loginRes = await loginHandler(
      jsonRequest("/api/auth/login", { email, password: "wrong-password" }),
    );
    const body = await loginRes.json();

    expect(loginRes.status).toBe(401);
    expect(body.error.code).toBe("AUTH-002");
  });

  it("rejects duplicate registration", async () => {
    const email = uniqueEmail();
    await registerHandler(jsonRequest("/api/auth/register", { email, password: "password123" }));

    const secondRes = await registerHandler(
      jsonRequest("/api/auth/register", { email, password: "password123" }),
    );
    const body = await secondRes.json();

    expect(secondRes.status).toBe(409);
    expect(body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });
});
