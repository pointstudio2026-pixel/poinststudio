import { describe, expect, it, vi } from "vitest";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { GetProjectUseCase } from "@/modules/projects/application/GetProjectUseCase";
import { ShareProjectWithTeamUseCase } from "@/modules/projects/application/ShareProjectWithTeamUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { NotFoundError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

async function createProject(repo: FakeProjectRepository, userId: string) {
  const { projectId } = await new CreateProjectUseCase(repo).execute({ userId, name: "Brand" });
  return projectId;
}

describe("ShareProjectWithTeamUseCase", () => {
  it("lets the owner turn sharing on", async () => {
    const repo = new FakeProjectRepository();
    const projectId = await createProject(repo, "owner");
    const useCase = new ShareProjectWithTeamUseCase(repo);

    const updated = await useCase.execute({ projectId, userId: "owner", sharedWithTeam: true });

    expect(updated.sharedWithTeam).toBe(true);
  });

  it("rejects a non-owner, even one with an existing team membership on the project (공유 토글은 소유자 전용)", async () => {
    const repo = new FakeProjectRepository();
    const projectId = await createProject(repo, "owner");
    const project = repo.projects.find((p) => p.id === projectId)!;
    project.sharedWithTeam = true;
    repo.sharedMemberships.push({ projectId, userId: "team-member" });
    const useCase = new ShareProjectWithTeamUseCase(repo);

    await expect(
      useCase.execute({ projectId, userId: "team-member", sharedWithTeam: false }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("project access control -- team sharing (findByIdForUser/listForUser)", () => {
  it("blocks a non-member from a project that isn't shared", async () => {
    const repo = new FakeProjectRepository();
    const projectId = await createProject(repo, "owner");
    const getUseCase = new GetProjectUseCase(repo);

    await expect(getUseCase.execute({ projectId, userId: "outsider" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("grants access to a team member once the owner shares the project", async () => {
    const repo = new FakeProjectRepository();
    const projectId = await createProject(repo, "owner");
    const getUseCase = new GetProjectUseCase(repo);
    const shareUseCase = new ShareProjectWithTeamUseCase(repo);
    repo.sharedMemberships.push({ projectId, userId: "team-member" });

    // 아직 공유를 켜지 않았으면 여전히 접근 불가.
    await expect(getUseCase.execute({ projectId, userId: "team-member" })).rejects.toBeInstanceOf(
      NotFoundError,
    );

    await shareUseCase.execute({ projectId, userId: "owner", sharedWithTeam: true });

    await expect(getUseCase.execute({ projectId, userId: "team-member" })).resolves.toMatchObject({
      id: projectId,
    });
  });

  it("still blocks a user who is a team member elsewhere but not on THIS project's team (다른 팀 멤버십은 무관)", async () => {
    const repo = new FakeProjectRepository();
    const projectId = await createProject(repo, "owner");
    const project = repo.projects.find((p) => p.id === projectId)!;
    project.sharedWithTeam = true;
    // "stranger"는 이 프로젝트의 sharedMemberships엔 없다(다른 프로젝트/팀 소속이라고 가정).
    const getUseCase = new GetProjectUseCase(repo);

    await expect(getUseCase.execute({ projectId, userId: "stranger" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
