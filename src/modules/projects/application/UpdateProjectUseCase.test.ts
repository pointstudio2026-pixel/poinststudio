import { describe, expect, it, vi } from "vitest";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { UpdateProjectUseCase } from "@/modules/projects/application/UpdateProjectUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { NotFoundError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

describe("UpdateProjectUseCase", () => {
  it("renames a project (프로젝트 이름 변경)", async () => {
    const repo = new FakeProjectRepository();
    const { projectId } = await new CreateProjectUseCase(repo).execute({
      userId: "user-1",
      name: "Old Name",
    });
    const useCase = new UpdateProjectUseCase(repo);

    const updated = await useCase.execute({ projectId, userId: "user-1", name: "New Name" });
    expect(updated.name).toBe("New Name");
  });

  it("toggles favorite and archive independently of name", async () => {
    const repo = new FakeProjectRepository();
    const { projectId } = await new CreateProjectUseCase(repo).execute({
      userId: "user-1",
      name: "Brand",
    });
    const useCase = new UpdateProjectUseCase(repo);

    const favorited = await useCase.execute({ projectId, userId: "user-1", isFavorite: true });
    expect(favorited.isFavorite).toBe(true);
    expect(favorited.name).toBe("Brand");

    const archived = await useCase.execute({ projectId, userId: "user-1", archived: true });
    expect(archived.archivedAt).toBeInstanceOf(Date);

    const unarchived = await useCase.execute({ projectId, userId: "user-1", archived: false });
    expect(unarchived.archivedAt).toBeNull();
  });

  it("rejects updates to a project the user does not own", async () => {
    const repo = new FakeProjectRepository();
    const { projectId } = await new CreateProjectUseCase(repo).execute({
      userId: "owner",
      name: "Brand",
    });
    const useCase = new UpdateProjectUseCase(repo);

    await expect(
      useCase.execute({ projectId, userId: "someone-else", name: "Hijacked" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects updates to a non-existent project", async () => {
    const repo = new FakeProjectRepository();
    const useCase = new UpdateProjectUseCase(repo);

    await expect(
      useCase.execute({ projectId: "missing", userId: "user-1", name: "x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
