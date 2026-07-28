import { describe, expect, it, vi } from "vitest";
import { AddProjectLogoUseCase } from "@/modules/projectLogos/application/AddProjectLogoUseCase";
import { GetProjectLogoImageUseCase } from "@/modules/projectLogos/application/GetProjectLogoImageUseCase";
import { SelectLogoChoiceUseCase } from "@/modules/projectLogos/application/SelectLogoChoiceUseCase";
import { FakeProjectLogoAssetRepository } from "@/modules/projectLogos/testing/fakes";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { FakeFileStorage } from "@/shared/storage/testing/FakeFileStorage";
import type { Project } from "@/modules/projects/domain/Project";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

function buildProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    userId: "user-1",
    name: "Poster Project",
    status: "in_progress",
    deliverableType: "포스터",
    currentStep: "logo_choice",
    isFavorite: false,
    sharedWithTeam: false,
    isStandaloneMockup: false,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function setup() {
  const projects = new FakeProjectRepository();
  const logoAssets = new FakeProjectLogoAssetRepository();
  const fileStorage = new FakeFileStorage();

  const project = buildProject();
  projects.projects.push(project);

  return {
    projects,
    logoAssets,
    fileStorage,
    project,
    add: new AddProjectLogoUseCase(projects, logoAssets, fileStorage),
    getImage: new GetProjectLogoImageUseCase(projects, logoAssets, fileStorage),
    selectChoice: new SelectLogoChoiceUseCase(projects, logoAssets, fileStorage),
  };
}

describe("AddProjectLogoUseCase", () => {
  it("saves the logo to file storage and records the asset", async () => {
    const ctx = setup();

    const asset = await ctx.add.execute({
      userId: ctx.project.userId,
      projectId: ctx.project.id,
      data: Buffer.from("logo-bytes"),
      contentType: "image/png",
      originalFileName: "logo.png",
    });

    expect(asset.projectId).toBe(ctx.project.id);
    expect(asset.contentType).toBe("image/png");
    const stored = await ctx.fileStorage.read(asset.storageKey);
    expect(stored?.data.toString()).toBe("logo-bytes");
  });

  it("replaces an existing logo on re-upload (upsert)", async () => {
    const ctx = setup();
    const first = await ctx.add.execute({
      userId: ctx.project.userId,
      projectId: ctx.project.id,
      data: Buffer.from("first"),
      contentType: "image/png",
    });
    const second = await ctx.add.execute({
      userId: ctx.project.userId,
      projectId: ctx.project.id,
      data: Buffer.from("second"),
      contentType: "image/png",
    });

    expect(second.id).toBe(first.id);
    const stored = await ctx.getImage.execute({ userId: ctx.project.userId, projectId: ctx.project.id });
    expect(stored.data.toString()).toBe("second");
  });

  it("rejects a non-PNG/JPEG content type", async () => {
    const ctx = setup();
    await expect(
      ctx.add.execute({
        userId: ctx.project.userId,
        projectId: ctx.project.id,
        data: Buffer.from("x"),
        contentType: "image/svg+xml",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects a file over 5MB", async () => {
    const ctx = setup();
    await expect(
      ctx.add.execute({
        userId: ctx.project.userId,
        projectId: ctx.project.id,
        data: Buffer.alloc(6 * 1024 * 1024),
        contentType: "image/png",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects a project the user doesn't own", async () => {
    const ctx = setup();
    await expect(
      ctx.add.execute({
        userId: "someone-else",
        projectId: ctx.project.id,
        data: Buffer.from("x"),
        contentType: "image/png",
      }),
    ).rejects.toThrow(NotFoundError);
  });
});

describe("SelectLogoChoiceUseCase", () => {
  it("advances logo_choice -> generation when choosing 'skip'", async () => {
    const ctx = setup();

    const updated = await ctx.selectChoice.execute({ userId: ctx.project.userId, projectId: ctx.project.id, choice: "skip" });

    expect(updated.currentStep).toBe("generation");
  });

  it("advances logo_choice -> generation when choosing 'upload' with a logo already attached", async () => {
    const ctx = setup();
    await ctx.add.execute({
      userId: ctx.project.userId,
      projectId: ctx.project.id,
      data: Buffer.from("logo"),
      contentType: "image/png",
    });

    const updated = await ctx.selectChoice.execute({ userId: ctx.project.userId, projectId: ctx.project.id, choice: "upload" });

    expect(updated.currentStep).toBe("generation");
  });

  it("rejects 'upload' when no logo has actually been attached yet", async () => {
    const ctx = setup();
    await expect(
      ctx.selectChoice.execute({ userId: ctx.project.userId, projectId: ctx.project.id, choice: "upload" }),
    ).rejects.toThrow(ValidationError);
  });

  it("deletes an already-uploaded logo (file + record) when the user changes their mind and picks 'skip'", async () => {
    const ctx = setup();
    const asset = await ctx.add.execute({
      userId: ctx.project.userId,
      projectId: ctx.project.id,
      data: Buffer.from("logo"),
      contentType: "image/png",
    });

    await ctx.selectChoice.execute({ userId: ctx.project.userId, projectId: ctx.project.id, choice: "skip" });

    expect(await ctx.logoAssets.findByProjectId(ctx.project.id)).toBeNull();
    expect(await ctx.fileStorage.read(asset.storageKey)).toBeNull();
  });

  it("is idempotent -- calling it again after currentStep already advanced doesn't move it further", async () => {
    const ctx = setup();
    await ctx.selectChoice.execute({ userId: ctx.project.userId, projectId: ctx.project.id, choice: "skip" });

    const second = await ctx.selectChoice.execute({ userId: ctx.project.userId, projectId: ctx.project.id, choice: "skip" });

    expect(second.currentStep).toBe("generation");
  });
});
