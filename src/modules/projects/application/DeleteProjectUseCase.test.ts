import { describe, expect, it, vi } from "vitest";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { GetProjectUseCase } from "@/modules/projects/application/GetProjectUseCase";
import { DeleteProjectUseCase } from "@/modules/projects/application/DeleteProjectUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { NotFoundError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

describe("DeleteProjectUseCase", () => {
  it("makes a deleted project inaccessible (삭제 후 접근)", async () => {
    const repo = new FakeProjectRepository();
    const { projectId } = await new CreateProjectUseCase(repo).execute({
      userId: "user-1",
      name: "Brand",
    });
    const deleteUseCase = new DeleteProjectUseCase(repo);
    const getUseCase = new GetProjectUseCase(repo);

    await deleteUseCase.execute({ projectId, userId: "user-1" });

    await expect(
      getUseCase.execute({ projectId, userId: "user-1" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects deleting a project the user does not own", async () => {
    const repo = new FakeProjectRepository();
    const { projectId } = await new CreateProjectUseCase(repo).execute({
      userId: "owner",
      name: "Brand",
    });
    const deleteUseCase = new DeleteProjectUseCase(repo);

    await expect(
      deleteUseCase.execute({ projectId, userId: "someone-else" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects deleting a team-shared project even though the member can otherwise access it (삭제는 소유자 전용)", async () => {
    const repo = new FakeProjectRepository();
    const { projectId } = await new CreateProjectUseCase(repo).execute({
      userId: "owner",
      name: "Brand",
    });
    const project = repo.projects.find((p) => p.id === projectId)!;
    project.sharedWithTeam = true;
    repo.sharedMemberships.push({ projectId, userId: "team-member" });
    const deleteUseCase = new DeleteProjectUseCase(repo);
    const getUseCase = new GetProjectUseCase(repo);

    // 팀원은 findByIdForUser로 이 프로젝트에 접근 가능하지만(공유됨)
    await expect(getUseCase.execute({ projectId, userId: "team-member" })).resolves.toBeTruthy();
    // 삭제는 여전히 거부되어야 한다.
    await expect(
      deleteUseCase.execute({ projectId, userId: "team-member" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    // 그리고 실제로 삭제되지 않았어야 한다.
    await expect(getUseCase.execute({ projectId, userId: "owner" })).resolves.toBeTruthy();
  });
});
