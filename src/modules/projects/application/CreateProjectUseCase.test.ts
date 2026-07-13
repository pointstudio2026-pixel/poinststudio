import { describe, expect, it, vi } from "vitest";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { GetProjectUseCase } from "@/modules/projects/application/GetProjectUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { NotFoundError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

describe("CreateProjectUseCase", () => {
  it("creates a project owned by the requesting user, in draft/brand_interview", async () => {
    const repo = new FakeProjectRepository();
    const useCase = new CreateProjectUseCase(repo);

    const result = await useCase.execute({ userId: "user-1", name: "My Brand" });

    expect(result.status).toBe("draft");
    expect(repo.projects).toHaveLength(1);
    expect(repo.projects[0]).toMatchObject({
      id: result.projectId,
      userId: "user-1",
      name: "My Brand",
      status: "draft",
      currentStep: "brand_interview",
    });
  });
});

describe("GetProjectUseCase (ownership scoping)", () => {
  it("returns the project for its owner", async () => {
    const repo = new FakeProjectRepository();
    const createUseCase = new CreateProjectUseCase(repo);
    const getUseCase = new GetProjectUseCase(repo);
    const { projectId } = await createUseCase.execute({ userId: "user-1", name: "My Brand" });

    const project = await getUseCase.execute({ projectId, userId: "user-1" });
    expect(project.name).toBe("My Brand");
  });

  it("hides the project from a different user (다른 사용자 프로젝트 접근 불가)", async () => {
    const repo = new FakeProjectRepository();
    const createUseCase = new CreateProjectUseCase(repo);
    const getUseCase = new GetProjectUseCase(repo);
    const { projectId } = await createUseCase.execute({ userId: "user-1", name: "My Brand" });

    await expect(
      getUseCase.execute({ projectId, userId: "user-2" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
