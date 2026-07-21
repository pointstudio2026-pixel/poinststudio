import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { POST as refreshHandler } from "@/app/api/auth/refresh/route";
import { GET as meHandler } from "@/app/api/auth/me/route";
import { POST as oauthConsentHandler } from "@/app/api/auth/oauth/consent/route";
import { authContainer } from "@/modules/auth/container";
import { OAuthConsentRequiredError } from "@/modules/auth/application/OAuthLoginUseCase";
import { signOAuthPendingSignupToken } from "@/shared/auth/jwt";
import { OAUTH_PENDING_SIGNUP_COOKIE } from "@/shared/auth/cookies";

const TEST_EMAIL_PREFIX = "task002-route";

function uniqueEmail() {
  return `${TEST_EMAIL_PREFIX}-${Date.now()}-${Math.random().toString(16).slice(2)}@aster.dev`;
}

function jsonRequest(path: string, body: unknown, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
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
      jsonRequest("/api/auth/register", { email, password: "password123", agreedToTerms: true }),
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
    await registerHandler(jsonRequest("/api/auth/register", { email, password: "password123", agreedToTerms: true }));

    const loginRes = await loginHandler(
      jsonRequest("/api/auth/login", { email, password: "wrong-password" }),
    );
    const body = await loginRes.json();

    expect(loginRes.status).toBe(401);
    expect(body.error.code).toBe("AUTH-002");
  });

  it("rejects registration without agreeing to terms (이용약관 동의 필수)", async () => {
    const email = uniqueEmail();
    const res = await registerHandler(
      jsonRequest("/api/auth/register", { email, password: "password123" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects duplicate registration", async () => {
    const email = uniqueEmail();
    await registerHandler(jsonRequest("/api/auth/register", { email, password: "password123", agreedToTerms: true }));

    const secondRes = await registerHandler(
      jsonRequest("/api/auth/register", { email, password: "password123", agreedToTerms: true }),
    );
    const body = await secondRes.json();

    expect(secondRes.status).toBe(409);
    expect(body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("refreshes the session via the refresh cookie and rejects reuse of the old one", async () => {
    const email = uniqueEmail();
    const registerRes = await registerHandler(
      jsonRequest("/api/auth/register", { email, password: "password123", agreedToTerms: true }),
    );
    const originalCookies = cookieHeader(registerRes);

    const refreshRes = await refreshHandler(
      new NextRequest("http://localhost/api/auth/refresh", {
        method: "POST",
        headers: { cookie: originalCookies },
      }),
    );
    expect(refreshRes.status).toBe(200);
    const newCookies = cookieHeader(refreshRes);
    expect(newCookies).not.toBe(originalCookies);

    // New access token works.
    const meRes = await meHandler(
      new NextRequest("http://localhost/api/auth/me", { headers: { cookie: newCookies } }),
    );
    expect(meRes.status).toBe(200);

    // The original (now-rotated-out) refresh cookie must be rejected.
    const reuseRes = await refreshHandler(
      new NextRequest("http://localhost/api/auth/refresh", {
        method: "POST",
        headers: { cookie: originalCookies },
      }),
    );
    const reuseBody = await reuseRes.json();
    expect(reuseRes.status).toBe(401);
    expect(reuseBody.error.code).toBe("AUTH-008");
  });

  it("invalidates the refresh token on logout", async () => {
    const email = uniqueEmail();
    const registerRes = await registerHandler(
      jsonRequest("/api/auth/register", { email, password: "password123", agreedToTerms: true }),
    );
    const cookies = cookieHeader(registerRes);

    await logoutHandler(
      new NextRequest("http://localhost/api/auth/logout", {
        method: "POST",
        headers: { cookie: cookies },
      }),
    );

    const refreshAfterLogout = await refreshHandler(
      new NextRequest("http://localhost/api/auth/refresh", {
        method: "POST",
        headers: { cookie: cookies },
      }),
    );
    expect(refreshAfterLogout.status).toBe(401);
  });

  it("a genuinely new OAuth sign-in requires consent before any account is created (실사용자가 겪은 버그: 구글 로그인이 회원가입 절차 없이 바로 계정을 생성함)", async () => {
    const email = uniqueEmail();

    const attempt = authContainer.oauthLoginUseCase.execute({
      provider: "google",
      profile: { providerAccountId: `g-${email}`, email, name: "New OAuth User", emailVerified: true },
    });
    await expect(attempt).rejects.toBeInstanceOf(OAuthConsentRequiredError);

    const stored = await prisma.user.findUnique({ where: { email } });
    expect(stored).toBeNull();
  });

  it("completes OAuth sign-up via /api/auth/oauth/consent only after explicit agreement", async () => {
    const email = uniqueEmail();
    const pendingToken = signOAuthPendingSignupToken({
      provider: "google",
      providerAccountId: `g-${email}`,
      email,
      emailVerified: true,
      name: "New OAuth User",
    });

    const res = await oauthConsentHandler(
      jsonRequest("/api/auth/oauth/consent", { agreedToTerms: true }, `${OAUTH_PENDING_SIGNUP_COOKIE}=${pendingToken}`),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.user.email).toBe(email);
    expect(cookieHeader(res)).toContain("aster_access_token=");

    const stored = await prisma.user.findUnique({ where: { email } });
    expect(stored).not.toBeNull();
    expect(stored!.emailVerifiedAt).not.toBeNull();
  });

  it("rejects OAuth consent completion when agreedToTerms is false", async () => {
    const email = uniqueEmail();
    const pendingToken = signOAuthPendingSignupToken({
      provider: "google",
      providerAccountId: `g-${email}`,
      email,
      emailVerified: true,
      name: null,
    });

    const res = await oauthConsentHandler(
      jsonRequest("/api/auth/oauth/consent", { agreedToTerms: false }, `${OAUTH_PENDING_SIGNUP_COOKIE}=${pendingToken}`),
    );
    expect(res.status).toBe(400);

    const stored = await prisma.user.findUnique({ where: { email } });
    expect(stored).toBeNull();
  });

  it("rejects OAuth consent completion with no pending signup cookie (AUTH-012)", async () => {
    const res = await oauthConsentHandler(jsonRequest("/api/auth/oauth/consent", { agreedToTerms: true }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("AUTH-012");
  });

  it("returning OAuth users are unaffected -- no consent needed on repeat sign-in", async () => {
    const email = uniqueEmail();
    const providerAccountId = `g-${email}`;

    const first = await authContainer.completeOAuthSignupUseCase.execute({
      provider: "google",
      profile: { providerAccountId, email, name: "Returning User", emailVerified: true },
    });

    const second = await authContainer.oauthLoginUseCase.execute({
      provider: "google",
      profile: { providerAccountId, email, name: "Returning User", emailVerified: true },
    });

    expect(second.isNewUser).toBe(false);
    expect(second.user.id).toBe(first.user.id);
  });
});
