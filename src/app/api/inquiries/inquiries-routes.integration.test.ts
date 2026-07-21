import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { PrismaRefreshTokenRepository } from "@/modules/auth/infrastructure/PrismaRefreshTokenRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import { TokenService } from "@/modules/auth/application/TokenService";
import { GET as listInquiriesHandler, POST as submitInquiryHandler } from "@/app/api/inquiries/route";
import { GET as getInquiryHandler } from "@/app/api/inquiries/[id]/route";
import { PRIVATE_INQUIRY_PLACEHOLDER } from "@/modules/inquiries/domain/Inquiry";

const TEST_EMAIL_PREFIX = "task-inquiries-route";

function uniqueEmail() {
  return `${TEST_EMAIL_PREFIX}-${Date.now()}-${Math.random().toString(16).slice(2)}@aster.dev`;
}

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
});

async function createSessionCookie(role: "designer" | "admin" = "designer") {
  const userRepository = new PrismaUserRepository();
  const tokenService = new TokenService(new PrismaRefreshTokenRepository());
  const user = await userRepository.create({
    email: uniqueEmail(),
    passwordHash: await new Argon2PasswordHasher().hash("password123"),
  });
  if (role === "admin") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "admin" } });
  }
  const tokens = await tokenService.issueTokenPair({ id: user.id, role });
  return { userId: user.id, cookie: `aster_access_token=${tokens.accessToken}` };
}

function postRequest(path: string, body: unknown, cookie: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(body),
  });
}

function getRequest(path: string, cookie: string) {
  return new NextRequest(`http://localhost${path}`, { headers: { cookie } });
}

function withParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function submit(cookie: string, subject: string, isPublic: boolean) {
  const res = await submitInquiryHandler(
    postRequest("/api/inquiries", { subject, message: `${subject} 내용`, isPublic }, cookie),
  );
  const { data } = await res.json();
  return data.inquiry.id as string;
}

describe("Inquiries routes (커뮤니티 문의사항)", () => {
  it("shows the real subject for public inquiries in the list, masks private ones for everyone", async () => {
    const author = await createSessionCookie();
    const viewer = await createSessionCookie();
    await submit(author.cookie, "공개 문의 제목", true);
    await submit(author.cookie, "비공개 문의 제목", false);

    const res = await listInquiriesHandler(getRequest("/api/inquiries", viewer.cookie));
    const body = await res.json();
    const subjects = body.data.inquiries.map((i: { subject: string }) => i.subject);

    expect(subjects).toContain("공개 문의 제목");
    expect(subjects).toContain(PRIVATE_INQUIRY_PLACEHOLDER);
    expect(subjects).not.toContain("비공개 문의 제목");
  });

  it("blocks a stranger from opening a private inquiry's detail (403)", async () => {
    const author = await createSessionCookie();
    const stranger = await createSessionCookie();
    const id = await submit(author.cookie, "비공개 상세", false);

    const res = await getInquiryHandler(getRequest(`/api/inquiries/${id}`, stranger.cookie), withParams(id));
    expect(res.status).toBe(403);
  });

  it("lets the author open their own private inquiry's detail", async () => {
    const author = await createSessionCookie();
    const id = await submit(author.cookie, "비공개 상세", false);

    const res = await getInquiryHandler(getRequest(`/api/inquiries/${id}`, author.cookie), withParams(id));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.inquiry.subject).toBe("비공개 상세");
  });

  it("lets an admin open someone else's private inquiry's detail", async () => {
    const author = await createSessionCookie();
    const admin = await createSessionCookie("admin");
    const id = await submit(author.cookie, "비공개 상세", false);

    const res = await getInquiryHandler(getRequest(`/api/inquiries/${id}`, admin.cookie), withParams(id));
    expect(res.status).toBe(200);
  });

  it("lets anyone open a public inquiry's detail", async () => {
    const author = await createSessionCookie();
    const viewer = await createSessionCookie();
    const id = await submit(author.cookie, "공개 상세", true);

    const res = await getInquiryHandler(getRequest(`/api/inquiries/${id}`, viewer.cookie), withParams(id));
    expect(res.status).toBe(200);
  });
});
