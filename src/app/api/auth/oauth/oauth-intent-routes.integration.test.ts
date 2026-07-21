import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma";
import { OAUTH_INTENT_COOKIE, OAUTH_STATE_COOKIE } from "@/shared/auth/cookies";
import { GET as callbackHandler } from "@/app/api/auth/oauth/[provider]/callback/route";

const TEST_EMAIL_PREFIX = "oauth-intent-route";

function uniqueEmail() {
  return `${TEST_EMAIL_PREFIX}-${Date.now()}-${Math.random().toString(16).slice(2)}@aster.dev`;
}

let mockProfileEmail = "";

// 실제 구글/카카오와 통신하지 않고, 이 콜백이 항상 "완전히 새로운 사용자"
// 프로필을 반환받았다고 가정한 상태에서 intent(login/register)에 따라
// 콜백 라우트가 실제로 다르게 분기하는지만 검증한다.
vi.mock("@/shared/oauth/oauthRegistry", () => ({
  getOAuthProvider: () => ({
    name: "google",
    getAuthorizationUrl: () => "https://accounts.google.com/mock",
    exchangeCodeForProfile: async () => ({
      providerAccountId: `mock-${mockProfileEmail}`,
      email: mockProfileEmail,
      name: "Mock User",
      emailVerified: true,
    }),
  }),
}));

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
});

function callbackRequest(intent: "login" | "register") {
  const cookie = `${OAUTH_STATE_COOKIE}=state-123; ${OAUTH_INTENT_COOKIE}=${intent}`;
  return new NextRequest("http://localhost/api/auth/oauth/google/callback?code=mock-code&state=state-123", {
    headers: { cookie },
  });
}

describe("OAuth callback intent branching (로그인 버튼 vs 회원가입 버튼)", () => {
  it("로그인 페이지의 버튼으로 신규 사용자가 들어오면 계정을 만들지 않고 no_account로 안내한다", async () => {
    mockProfileEmail = uniqueEmail();

    const res = await callbackHandler(callbackRequest("login"), {
      params: Promise.resolve({ provider: "google" }),
    });

    expect(res.headers.get("location")).toContain("/login?oauthError=no_account");
    const stored = await prisma.user.findUnique({ where: { email: mockProfileEmail } });
    expect(stored).toBeNull();
  });

  it("회원가입 페이지의 버튼으로 신규 사용자가 들어오면 동의 화면으로 보내고 아직 계정을 만들지 않는다", async () => {
    mockProfileEmail = uniqueEmail();

    const res = await callbackHandler(callbackRequest("register"), {
      params: Promise.resolve({ provider: "google" }),
    });

    expect(res.headers.get("location")).toContain("/oauth/consent");
    const stored = await prisma.user.findUnique({ where: { email: mockProfileEmail } });
    expect(stored).toBeNull();
  });
});
