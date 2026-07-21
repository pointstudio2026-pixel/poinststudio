import { describe, expect, it, vi } from "vitest";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { SelectDeliverableTypeUseCase } from "@/modules/projects/application/SelectDeliverableTypeUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

async function setup() {
  const projects = new FakeProjectRepository();
  const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Brand" });
  return { projectId, projects, select: new SelectDeliverableTypeUseCase(projects) };
}

describe("SelectDeliverableTypeUseCase", () => {
  it("saves the type and advances a fresh project from deliverable_type to brand_interview (정상 선택)", async () => {
    const { projectId, projects, select } = await setup();

    const updated = await select.execute({ projectId, userId: "user-1", deliverableType: "포스터" });

    expect(updated.deliverableType).toBe("포스터");
    expect(updated.currentStep).toBe("brand_interview");
  });

  it("rejects a value outside DELIVERABLE_TYPE_OPTIONS", async () => {
    const { projectId, select } = await setup();
    await expect(
      select.execute({ projectId, userId: "user-1", deliverableType: "존재하지않는유형" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("does not rewind currentStep if the project has already moved past deliverable_type", async () => {
    const { projectId, projects, select } = await setup();
    const project = projects.projects.find((p) => p.id === projectId)!;
    project.currentStep = "generation";

    const updated = await select.execute({ projectId, userId: "user-1", deliverableType: "브랜딩 & 로고" });

    expect(updated.deliverableType).toBe("브랜딩 & 로고");
    expect(updated.currentStep).toBe("generation");
  });

  it("rejects access from a user who doesn't own the project (권한 검증)", async () => {
    const { projectId, select } = await setup();
    await expect(
      select.execute({ projectId, userId: "someone-else", deliverableType: "포스터" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
