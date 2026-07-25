import { describe, expect, it, vi } from "vitest";
import { ProcessGenerationJobUseCase } from "@/modules/generations/application/ProcessGenerationJobUseCase";
import { GenerateFromLogoAssetUseCase } from "@/modules/generations/application/GenerateFromLogoAssetUseCase";
import { EvaluateGenerationVisionUseCase } from "@/modules/generations/application/EvaluateGenerationVisionUseCase";
import { FakeGenerationRepository, FakeGenerationEvaluationRepository } from "@/modules/generations/testing/fakes";
import { FakePromptRepository } from "@/modules/prompts/testing/fakes";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { FakeProjectLogoAssetRepository } from "@/modules/projectLogos/testing/fakes";
import { FakeMockupTemplateRepository } from "@/modules/mockups/testing/fakes";
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import { FakeStyleRepository, FakeStyleSelectionRepository } from "@/modules/styles/testing/fakes";
import { FakePromptDecisionRecordRepository } from "@/modules/promptPriority/testing/fakes";
import { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import { FakeUsageRepository } from "@/modules/subscriptions/testing/fakes";
import { MockVisionEvaluationProvider } from "@/shared/ai/MockVisionEvaluationProvider";
import { FakeFileStorage } from "@/shared/storage/testing/FakeFileStorage";
import type { Project } from "@/modules/projects/domain/Project";
import type { MockupTemplate } from "@/modules/mockups/domain/Mockup";
import type { MockupRenderProvider } from "@/shared/ai/MockupRenderProvider";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

const TEMPLATE: MockupTemplate = {
  id: "template-1",
  category: "poster",
  name: "Poster A",
  slug: "poster-a",
  description: "설명",
  backgroundUrl: "data:image/svg+xml;base64,AAA",
  placementArea: { xPct: 30, yPct: 35, widthPct: 40, heightPct: 30 },
  fullDesignPlacementArea: { xPct: 10, yPct: 10, widthPct: 80, heightPct: 80 },
};

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
  const templates = new FakeMockupTemplateRepository();
  const interviews = new FakeInterviewRepository();
  const styleSelections = new FakeStyleSelectionRepository();
  const styles = new FakeStyleRepository();

  templates.templates = [TEMPLATE];

  let mockupRenderCalls = 0;
  const mockupRenderProvider: MockupRenderProvider = {
    name: "capturing-mockup",
    async render() {
      mockupRenderCalls++;
      return {
        imageUrl: "data:image/svg+xml;base64,MOCKUP",
        thumbnailUrl: "data:image/svg+xml;base64,MOCKUP_THUMB",
        provider: "capturing-mockup",
        costAmount: 0.053,
      };
    },
    async health() {
      return true;
    },
  };

  const generateFromLogoAssetUseCase = new GenerateFromLogoAssetUseCase(
    fileStorage,
    templates,
    interviews,
    styleSelections,
    styles,
    mockupRenderProvider,
  );

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

  return { projects, generations, usage, logoAssets, fileStorage, templates, process, project, generation, mockupRenderCallsRef: () => mockupRenderCalls };
}

describe("ProcessGenerationJobUseCase -- 실제 로고 첨부 분기", () => {
  it("uses GenerateFromLogoAssetUseCase (not the text-to-image provider) when a logo is attached, and completes the version normally", async () => {
    const ctx = await setup();
    const saved = await ctx.fileStorage.save("project-logos/project-1/logo", Buffer.from("logo-bytes"), "image/png");
    await ctx.logoAssets.save({ projectId: ctx.project.id, storageKey: saved.key, contentType: "image/png" });

    await ctx.process.execute({
      generationVersionId: ctx.generation.currentVersion.id,
      isFinalAttempt: true,
      requestedByUserId: ctx.project.userId,
    });

    const version = await ctx.generations.getVersionById(ctx.generation.currentVersion.id);
    expect(version?.status).toBe("completed");
    expect(version?.provider).toBe("capturing-mockup");
    expect(version?.images).toEqual([{ url: "data:image/svg+xml;base64,MOCKUP", thumbnailUrl: "data:image/svg+xml;base64,MOCKUP_THUMB" }]);
    expect(ctx.mockupRenderCallsRef()).toBe(1);
  });

  it("still records usage against the same GENERATION_EVENT_TYPE quota and advances currentStep exactly like a normal generation", async () => {
    const ctx = await setup();
    const saved = await ctx.fileStorage.save("project-logos/project-1/logo", Buffer.from("logo-bytes"), "image/png");
    await ctx.logoAssets.save({ projectId: ctx.project.id, storageKey: saved.key, contentType: "image/png" });

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
    expect(version?.provider).not.toBe("capturing-mockup");
    expect(ctx.mockupRenderCallsRef()).toBe(0);
  });
});
