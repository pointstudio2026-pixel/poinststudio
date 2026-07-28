import { describe, expect, it } from "vitest";
import { GenerateFromLogoAssetUseCase } from "@/modules/generations/application/GenerateFromLogoAssetUseCase";
import { FakeMockupTemplateRepository } from "@/modules/mockups/testing/fakes";
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import { FakeStyleRepository, FakeStyleSelectionRepository } from "@/modules/styles/testing/fakes";
import { FakeFileStorage } from "@/shared/storage/testing/FakeFileStorage";
import type { MockupRenderProvider, MockupRenderRequest } from "@/shared/ai/MockupRenderProvider";
import type { MockupTemplate } from "@/modules/mockups/domain/Mockup";
import type { Project } from "@/modules/projects/domain/Project";
import type { ProjectLogoAsset } from "@/modules/projectLogos/domain/ProjectLogoAsset";
import { InternalError } from "@/shared/errors/AppError";

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

function capturingProvider(): { provider: MockupRenderProvider; captured: MockupRenderRequest[] } {
  const captured: MockupRenderRequest[] = [];
  return {
    captured,
    provider: {
      name: "capturing",
      async render(request) {
        captured.push(request);
        return { imageUrl: "data:image/png;base64,X", thumbnailUrl: "data:image/png;base64,X", provider: "capturing", costAmount: 0.053 };
      },
      async health() {
        return true;
      },
    },
  };
}

const TEMPLATE_A: MockupTemplate = {
  id: "template-a",
  category: "poster",
  name: "Poster A",
  slug: "poster-a",
  description: "설명",
  backgroundUrl: "data:image/svg+xml;base64,AAA",
  placementArea: { xPct: 30, yPct: 35, widthPct: 40, heightPct: 30 },
  fullDesignPlacementArea: { xPct: 10, yPct: 10, widthPct: 80, heightPct: 80 },
  keywords: [],
};

const TEMPLATE_B: MockupTemplate = { ...TEMPLATE_A, id: "template-b", name: "Poster B", slug: "poster-b" };

async function setup() {
  const fileStorage = new FakeFileStorage();
  const templates = new FakeMockupTemplateRepository();
  const interviews = new FakeInterviewRepository();
  const styleSelections = new FakeStyleSelectionRepository();
  const styles = new FakeStyleRepository();
  const { provider, captured } = capturingProvider();

  templates.templates = [TEMPLATE_A, TEMPLATE_B];

  const saved = await fileStorage.save("project-logos/project-1/logo", Buffer.from("fake-logo-bytes"), "image/png");
  const logoAsset: ProjectLogoAsset = {
    id: "logo-1",
    projectId: "project-1",
    storageKey: saved.key,
    contentType: "image/png",
    originalFileName: "logo.png",
    createdAt: new Date(),
  };

  const useCase = new GenerateFromLogoAssetUseCase(fileStorage, templates, interviews, styleSelections, styles, provider);

  return { fileStorage, templates, interviews, styleSelections, styles, provider, captured, logoAsset, useCase };
}

describe("GenerateFromLogoAssetUseCase", () => {
  it("composites the real logo onto a template for the deliverable type's mockup category, in logo mode", async () => {
    const ctx = await setup();
    const project = buildProject();

    const result = await ctx.useCase.execute({ project, logoAsset: ctx.logoAsset });

    expect(ctx.captured).toHaveLength(1);
    expect(ctx.captured[0]?.category).toBe("poster");
    expect(ctx.captured[0]?.compositingMode).toBe("logo");
    expect(ctx.captured[0]?.placementArea).toEqual({ xPct: 30, yPct: 35, widthPct: 40, heightPct: 30 });
    expect(ctx.captured[0]?.logoImageUrl).toBe("data:image/png;base64,ZmFrZS1sb2dvLWJ5dGVz");
    expect(result.images).toEqual([{ url: "data:image/png;base64,X", thumbnailUrl: "data:image/png;base64,X" }]);
    expect(result.provider).toBe("capturing");
    expect(result.model).toBe("mockup-composite");
    expect(result.costAmount).toBe(0.053);
  });

  it("threads the project's industry answer through to the render request", async () => {
    const ctx = await setup();
    const project = buildProject();
    const interview = await ctx.interviews.create(project.id);
    interview.answers = [{ questionKey: "industry", questionText: "업종", answer: "카페/커피", sequence: 0 }] as never;

    await ctx.useCase.execute({ project, logoAsset: ctx.logoAsset });

    expect(ctx.captured[0]?.industry).toBe("카페/커피");
  });

  it("threads the project's selected style category (mood) text through to the render request", async () => {
    const ctx = await setup();
    const project = buildProject();
    ctx.styles.styles.push({
      id: "style-1",
      name: "미니멀",
      slug: "minimal",
      level: 1,
      parentId: null,
      category: "미니멀",
      keywords: [],
      description: "",
      sampleImageUrl: null,
    });
    await ctx.styleSelections.create(project.id, "style-1", []);

    await ctx.useCase.execute({ project, logoAsset: ctx.logoAsset });

    expect(ctx.captured[0]?.styleCategory).toContain("스칸디나비안풍");
  });

  it("omits styleCategory when the project has no style selection yet", async () => {
    const ctx = await setup();
    const project = buildProject();

    await ctx.useCase.execute({ project, logoAsset: ctx.logoAsset });

    expect(ctx.captured[0]?.styleCategory).toBeUndefined();
  });

  it("picks templates for the mockup category with variety across repeated calls", async () => {
    const ctx = await setup();
    const project = buildProject();

    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      await ctx.useCase.execute({ project, logoAsset: ctx.logoAsset });
      seen.add(ctx.captured[ctx.captured.length - 1]!.templateName);
    }

    expect(seen.size).toBeGreaterThan(1);
  });

  it("throws when the deliverable type has no mapped mockup category", async () => {
    const ctx = await setup();
    const project = buildProject({ deliverableType: "브랜딩 & 로고" });

    await expect(ctx.useCase.execute({ project, logoAsset: ctx.logoAsset })).rejects.toThrow(InternalError);
  });

  it("throws when no templates are seeded for the resolved category", async () => {
    const ctx = await setup();
    ctx.templates.templates = [];
    const project = buildProject();

    await expect(ctx.useCase.execute({ project, logoAsset: ctx.logoAsset })).rejects.toThrow(InternalError);
  });

  it("throws when the logo file is missing from storage", async () => {
    const ctx = await setup();
    const project = buildProject();
    const missingAsset: ProjectLogoAsset = { ...ctx.logoAsset, storageKey: "does-not-exist.png" };

    await expect(ctx.useCase.execute({ project, logoAsset: missingAsset })).rejects.toThrow(InternalError);
  });
});
