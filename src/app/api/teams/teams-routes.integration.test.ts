import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { PrismaRefreshTokenRepository } from "@/modules/auth/infrastructure/PrismaRefreshTokenRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import { TokenService } from "@/modules/auth/application/TokenService";
import { POST as createProjectHandler } from "@/app/api/projects/route";
import { GET as getProjectHandler, DELETE as deleteProjectHandler } from "@/app/api/projects/[id]/route";
import { POST as shareHandler } from "@/app/api/projects/[id]/share-with-team/route";
import { subscriptionRepository } from "@/modules/subscriptions/container";
import { POST as registerTeamHandler } from "@/app/api/teams/register/route";
import { POST as joinTeamHandler } from "@/app/api/teams/join/route";

const TEST_EMAIL_PREFIX = "task-teams-route";

function uniqueEmail() {
  return `${TEST_EMAIL_PREFIX}-${Date.now()}-${Math.random().toString(16).slice(2)}@aster.dev`;
}

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
});

async function createSessionCookie() {
  const userRepository = new PrismaUserRepository();
  const tokenService = new TokenService(new PrismaRefreshTokenRepository());
  const user = await userRepository.create({
    email: uniqueEmail(),
    passwordHash: await new Argon2PasswordHasher().hash("password123"),
  });
  const tokens = await tokenService.issueTokenPair({ id: user.id, role: user.role });
  return { userId: user.id, cookie: `aster_access_token=${tokens.accessToken}` };
}

function postRequest(path: string, body: unknown, cookie: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(body),
  });
}

function withParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// 요금제 셀프서비스 라우트는 관리자 전용으로 잠겼으므로(더 이상 사용자
// 본인이 API로 자기 플랜을 바꿀 수 없음), 테스트 셋업은 레포지토리를 직접
// 조작해 Studio 상태를 만든다.
async function upgradeToStudio(userId: string) {
  await subscriptionRepository.createDefault(userId);
  await subscriptionRepository.updatePlan(userId, "studio");
}

describe("Team feature -- real access-control against Postgres (findByIdForUser OR 필터)", () => {
  it("lets a team member load a project the owner shared, once they've joined via code", async () => {
    const owner = await createSessionCookie();
    const member = await createSessionCookie();
    await upgradeToStudio(owner.userId);

    const registerRes = await registerTeamHandler(
      new NextRequest("http://localhost/api/teams/register", { method: "POST", headers: { cookie: owner.cookie } }),
    );
    const { data: registerData } = await registerRes.json();
    const code = registerData.team.code as string;

    const createRes = await createProjectHandler(
      postRequest("/api/projects", { name: "Shared Brand" }, owner.cookie),
    );
    const { data: createData } = await createRes.json();
    const projectId = createData.projectId as string;

    // 아직 팀원이 코드를 입력하지 않았고 공유도 켜지 않았으므로 접근 불가.
    const beforeRes = await getProjectHandler(
      new NextRequest(`http://localhost/api/projects/${projectId}`, { headers: { cookie: member.cookie } }),
      withParams(projectId),
    );
    expect(beforeRes.status).toBe(404);

    await joinTeamHandler(postRequest("/api/teams/join", { code }, member.cookie));
    const shareRes = await shareHandler(
      postRequest(`/api/projects/${projectId}/share-with-team`, { sharedWithTeam: true }, owner.cookie),
      withParams(projectId),
    );
    expect(shareRes.status).toBe(200);

    const afterRes = await getProjectHandler(
      new NextRequest(`http://localhost/api/projects/${projectId}`, { headers: { cookie: member.cookie } }),
      withParams(projectId),
    );
    expect(afterRes.status).toBe(200);
    const afterBody = await afterRes.json();
    expect(afterBody.data.project.id).toBe(projectId);
  });

  it("still blocks a stranger who never joined the team, even after sharing is on", async () => {
    const owner = await createSessionCookie();
    const stranger = await createSessionCookie();
    await upgradeToStudio(owner.userId);
    await registerTeamHandler(
      new NextRequest("http://localhost/api/teams/register", { method: "POST", headers: { cookie: owner.cookie } }),
    );

    const createRes = await createProjectHandler(postRequest("/api/projects", { name: "Private" }, owner.cookie));
    const { data: createData } = await createRes.json();
    const projectId = createData.projectId as string;

    await shareHandler(
      postRequest(`/api/projects/${projectId}/share-with-team`, { sharedWithTeam: true }, owner.cookie),
      withParams(projectId),
    );

    const res = await getProjectHandler(
      new NextRequest(`http://localhost/api/projects/${projectId}`, { headers: { cookie: stranger.cookie } }),
      withParams(projectId),
    );
    expect(res.status).toBe(404);
  });

  it("still rejects a team member trying to delete the owner's shared project (삭제는 소유자 전용)", async () => {
    const owner = await createSessionCookie();
    const member = await createSessionCookie();
    await upgradeToStudio(owner.userId);
    const registerRes = await registerTeamHandler(
      new NextRequest("http://localhost/api/teams/register", { method: "POST", headers: { cookie: owner.cookie } }),
    );
    const { data: registerData } = await registerRes.json();
    await joinTeamHandler(postRequest("/api/teams/join", { code: registerData.team.code }, member.cookie));

    const createRes = await createProjectHandler(postRequest("/api/projects", { name: "Shared" }, owner.cookie));
    const { data: createData } = await createRes.json();
    const projectId = createData.projectId as string;
    await shareHandler(
      postRequest(`/api/projects/${projectId}/share-with-team`, { sharedWithTeam: true }, owner.cookie),
      withParams(projectId),
    );

    const deleteRes = await deleteProjectHandler(
      new NextRequest(`http://localhost/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { cookie: member.cookie },
      }),
      withParams(projectId),
    );
    expect(deleteRes.status).toBe(404);

    const stillThereRes = await getProjectHandler(
      new NextRequest(`http://localhost/api/projects/${projectId}`, { headers: { cookie: owner.cookie } }),
      withParams(projectId),
    );
    expect(stillThereRes.status).toBe(200);
  });
});
