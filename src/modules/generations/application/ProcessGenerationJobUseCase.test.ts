import { describe, expect, it, vi } from "vitest";
import { ProcessGenerationJobUseCase } from "@/modules/generations/application/ProcessGenerationJobUseCase";
import { GenerateFromLogoAssetUseCase } from "@/modules/generations/application/GenerateFromLogoAssetUseCase";
import { EvaluateGenerationVisionUseCase } from "@/modules/generations/application/EvaluateGenerationVisionUseCase";
import { FakeGenerationRepository, FakeGenerationEvaluationRepository } from "@/modules/generations/testing/fakes";
import { FakePromptRepository } from "@/modules/prompts/testing/fakes";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { FakeProjectLogoAssetRepository } from "@/modules/projectLogos/testing/fakes";
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import { FakePromptDecisionRecordRepository } from "@/modules/promptPriority/testing/fakes";
import { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import { FakeUsageRepository } from "@/modules/subscriptions/testing/fakes";
import { MockVisionEvaluationProvider } from "@/shared/ai/MockVisionEvaluationProvider";
import { FakeFileStorage } from "@/shared/storage/testing/FakeFileStorage";
import type { LogoPreservingImageProvider } from "@/shared/ai/LogoPreservingImageProvider";
import type { Project } from "@/modules/projects/domain/Project";

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
    currentStep: "generation",
    isFavorite: false,
    sharedWithTeam: false,
    isStandaloneMockup: false,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

async function setup() {
  const projects = new FakeProjectRepository();
  const prompts = new FakePromptRepository();
  const generations = new FakeGenerationRepository();
  const usage = new FakeUsageRepository();
  const promptDecisionRecords = new FakePromptDecisionRecordRepository();
  const generationEvaluations = new FakeGenerationEvaluationRepository();
  const logoAssets = new FakeProjectLogoAssetRepository();
  const fileStorage = new FakeFileStorage();
  const interviews = new FakeInterviewRepository();

  let logoPreservingCalls = 0;
  const logoPreservingProvider: LogoPreservingImageProvider = {
    name: "capturing-logo-preserving",
    async generate() {
      logoPreservingCalls++;
      return {
        images: [{ url: "data:image/svg+xml;base64,LOGO_SCENE", thumbnailUrl: "data:image/svg+xml;base64,LOGO_SCENE_THUMB" }],
        provider: "capturing-logo-preserving",
        model: "capturing-model",
        costAmount: 0.053,
      };
    },
  };

  const generateFromLogoAssetUseCase = new GenerateFromLogoAssetUseCase(fileStorage, logoPreservingProvider);

  const process = new ProcessGenerationJobUseCase(
    projects,
    prompts,
    generations,
    new RecordUsageUseCase(usage),
    promptDecisionRecords,
    generationEvaluations,
    new EvaluateGenerationVisionUseCase(generationEvaluations, promptDecisionRecords, interviews, new MockVisionEvaluationProvider()),
    logoAssets,
    generateFromLogoAssetUseCase,
  );

  const project = buildProject();
  projects.projects.push(project);

  const promptVersion = await prompts.createWithFirstVersion(project.id, {
    provider: "openai",
    systemPrompt: "system",
    userPrompt: "user prompt text",
    hash: "hash-1",
    payload: { provider: "openai", model: "gpt-image-2", systemPrompt: "system", userPrompt: "user", sizePreset: "square", parameters: {} },
    flaggedTerms: [],
  });
  const generation = await generations.createWithFirstVersion(project.id, { promptVersionId: promptVersion.currentVersion.id });

  return { projects, generations, usage, logoAssets, fileStorage, process, project, generation, logoPreservingCallsRef: () => logoPreservingCalls };
}

describe("ProcessGenerationJobUseCase -- 실제 로고 첨부 분기", () => {
  it("uses GenerateFromLogoAssetUseCase (not the text-to-image provider) when a logo is attached AND confirmed", async () => {
    const ctx = await setup();
    const saved = await ctx.fileStorage.save("project-logos/project-1/logo", Buffer.from("logo-bytes"), "image/png");
    await ctx.logoAssets.save({ projectId: ctx.project.id, storageKey: saved.key, contentType: "image/png" });
    await ctx.logoAssets.markConfirmed(ctx.project.id);

    await ctx.process.execute({
      generationVersionId: ctx.generation.currentVersion.id,
      isFinalAttempt: true,
      requestedByUserId: ctx.project.userId,
    });

    const version = await ctx.generations.getVersionById(ctx.generation.currentVersion.id);
    expect(version?.status).toBe("completed");
    expect(version?.provider).toBe("capturing-logo-preserving");
    expect(version?.images).toEqual([
      { url: "data:image/svg+xml;base64,LOGO_SCENE", thumbnailUrl: "data:image/svg+xml;base64,LOGO_SCENE_THUMB" },
    ]);
    expect(ctx.logoPreservingCallsRef()).toBe(1);
  });

  it("still records usage against the same GENERATION_EVENT_TYPE quota and advances currentStep exactly like a normal generation", async () => {
    const ctx = await setup();
    const saved = await ctx.fileStorage.save("project-logos/project-1/logo", Buffer.from("logo-bytes"), "image/png");
    await ctx.logoAssets.save({ projectId: ctx.project.id, storageKey: saved.key, contentType: "image/png" });
    await ctx.logoAssets.markConfirmed(ctx.project.id);

    await ctx.process.execute({
      generationVersionId: ctx.generation.currentVersion.id,
      isFinalAttempt: true,
      requestedByUserId: ctx.project.userId,
    });

    expect(ctx.usage.records).toHaveLength(1);
    expect(ctx.usage.records[0]?.eventType).toBe("image_generation");
    expect(ctx.usage.records[0]?.costAmount).toBe(0.053);

    const updatedProject = await ctx.projects.findById(ctx.project.id);
    expect(updatedProject?.currentStep).toBe("concept_board");
  });

  it("falls back to the normal text-to-image provider when no logo is attached", async () => {
    const ctx = await setup();

    await ctx.process.execute({
      generationVersionId: ctx.generation.currentVersion.id,
      isFinalAttempt: true,
      requestedByUserId: ctx.project.userId,
    });

    const version = await ctx.generations.getVersionById(ctx.generation.currentVersion.id);
    expect(version?.status).toBe("completed");
    expect(version?.provider).not.toBe("capturing-logo-preserving");
    expect(ctx.logoPreservingCallsRef()).toBe(0);
  });

  it("falls back to the normal text-to-image provider when a logo was uploaded but never confirmed (2026-08-01 bug fix)", async () => {
    const ctx = await setup();
    const saved = await ctx.fileStorage.save("project-logos/project-1/logo", Buffer.from("logo-bytes"), "image/png");
    // Uploaded via the dropzone, but the user never clicked "첨부하기" or
    // "건너뛰기" -- the asset row exists but is unconfirmed.
    await ctx.logoAssets.save({ projectId: ctx.project.id, storageKey: saved.key, contentType: "image/png" });

    await ctx.process.execute({
      generationVersionId: ctx.generation.currentVersion.id,
      isFinalAttempt: true,
      requestedByUserId: ctx.project.userId,
    });

    const version = await ctx.generations.getVersionById(ctx.generation.currentVersion.id);
    expect(version?.status).toBe("completed");
    expect(version?.provider).not.toBe("capturing-logo-preserving");
    expect(ctx.logoPreservingCallsRef()).toBe(0);
  });
});
