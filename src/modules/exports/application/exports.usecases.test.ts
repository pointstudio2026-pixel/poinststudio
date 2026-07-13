import { describe, expect, it, vi } from "vitest";
import { CreateExportUseCase } from "@/modules/exports/application/CreateExportUseCase";
import { GetExportsUseCase } from "@/modules/exports/application/GetExportsUseCase";
import { GetExportStatusUseCase } from "@/modules/exports/application/GetExportStatusUseCase";
import { DownloadExportUseCase } from "@/modules/exports/application/DownloadExportUseCase";
import { ProcessExportJobUseCase } from "@/modules/exports/application/ProcessExportJobUseCase";
import { FakeExportRepository, FakeExportQueue } from "@/modules/exports/testing/fakes";
import { PdfLibExportRenderer } from "@/modules/exports/infrastructure/PdfLibExportRenderer";
import { FakeFileStorage } from "@/shared/storage/testing/FakeFileStorage";
import { FakeConceptBoardRepository } from "@/modules/conceptBoards/testing/fakes";
import type { ConceptBoardData } from "@/modules/conceptBoards/domain/ConceptBoard";
import { CONCEPT_BOARD_SECTIONS } from "@/modules/conceptBoards/domain/ConceptBoard";
import { FakeBrandBriefRepository } from "@/modules/brandBriefs/testing/fakes";
import type { BrandBriefData } from "@/modules/brandBriefs/domain/BrandBrief";
import { FakeGenerationRepository } from "@/modules/generations/testing/fakes";
import { FakeMockupRepository } from "@/modules/mockups/testing/fakes";
import { GetSubscriptionUseCase } from "@/modules/subscriptions/application/GetSubscriptionUseCase";
import { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import { FakeSubscriptionRepository, FakeUsageRepository } from "@/modules/subscriptions/testing/fakes";
import { EXPORT_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

const SAMPLE_IMAGE =
  "data:image/svg+xml;base64," +
  Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="blue"/></svg>').toString(
    "base64",
  );

const BRIEF_DATA: BrandBriefData = {
  brandName: "Aster Bakery",
  industry: "bakery",
  tagline: "cozy",
  description: "fresh bread",
  mission: "fresh bread",
  vision: "trusted",
  coreValues: ["quality"],
  positioning: "friendly bakery",
  primaryAudience: "local families",
  secondaryAudience: "",
  customerProblems: "",
  desiredImpression: "cozy",
  brandTone: "따뜻한",
  brandPersonality: "친근한",
  keywords: ["bakery"],
  avoidKeywords: [],
  preferredStyle: "미니멀",
  preferredColor: "중성",
  preferredSymbol: "심플",
  typographyDirection: "산세리프",
};

const BOARD_DATA: ConceptBoardData = {
  heroImageUrl: SAMPLE_IMAGE,
  brandSummary: "요약",
  coreValues: ["quality"],
  styleKeywords: ["bakery"],
  colorPalette: [{ hex: "#7c2d12", label: "Terracotta" }],
  typographyDirection: "산세리프",
  logoConceptImageUrls: [SAMPLE_IMAGE],
  designNotes: "메모",
  sectionOrder: [...CONCEPT_BOARD_SECTIONS],
};

async function setup() {
  const projects = new FakeProjectRepository();
  const boards = new FakeConceptBoardRepository();
  const briefs = new FakeBrandBriefRepository();
  const generations = new FakeGenerationRepository();
  const mockups = new FakeMockupRepository();
  const exportsRepo = new FakeExportRepository();
  const queue = new FakeExportQueue();
  const subs = new FakeSubscriptionRepository();
  const usage = new FakeUsageRepository();
  const getSubscription = new GetSubscriptionUseCase(subs);
  const recordUsage = new RecordUsageUseCase(usage);
  const renderer = new PdfLibExportRenderer();
  const fileStorage = new FakeFileStorage();

  const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Bakery" });
  await briefs.createWithFirstVersion(projectId, BRIEF_DATA, "ai");
  await boards.createWithFirstVersion(projectId, BOARD_DATA, "ai");
  const generation = await generations.createWithFirstVersion(projectId, { promptVersionId: "prompt-1" });
  await generations.updateVersionResult(generation.currentVersion.id, {
    status: "completed",
    images: [{ url: SAMPLE_IMAGE, thumbnailUrl: SAMPLE_IMAGE }],
    completedAt: new Date(),
  });

  return {
    projectId,
    projects,
    boards,
    briefs,
    generations,
    mockups,
    exportsRepo,
    queue,
    subs,
    usage,
    generationVersionId: generation.currentVersion.id,
    create: new CreateExportUseCase(projects, boards, generations, mockups, getSubscription, exportsRepo, queue),
    getExports: new GetExportsUseCase(projects, exportsRepo),
    getStatus: new GetExportStatusUseCase(projects, exportsRepo),
    download: new DownloadExportUseCase(projects, exportsRepo, fileStorage),
    process: new ProcessExportJobUseCase(
      projects,
      boards,
      briefs,
      generations,
      mockups,
      exportsRepo,
      renderer,
      fileStorage,
      recordUsage,
    ),
  };
}

describe("CreateExportUseCase", () => {
  it("rejects a format not valid for the source", async () => {
    const ctx = await setup();
    await expect(
      ctx.create.execute({ projectId: ctx.projectId, userId: "user-1", source: "concept_board", format: "png" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects concept_board export before a board exists", async () => {
    const ctx = await setup();
    const { projectId: emptyProjectId } = await new CreateProjectUseCase(ctx.projects).execute({
      userId: "user-1",
      name: "Empty",
    });
    await expect(
      ctx.create.execute({ projectId: emptyProjectId, userId: "user-1", source: "concept_board", format: "pdf" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("creates a pending PDF export for concept_board and enqueues a job (PDF Export)", async () => {
    const ctx = await setup();
    const job = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      source: "concept_board",
      format: "pdf",
    });

    expect(job.status).toBe("pending");
    expect(job.sections).toEqual(CONCEPT_BOARD_SECTIONS);
    expect(ctx.queue.enqueued).toEqual([{ exportId: job.id }]);
  });

  it("creates a pending PNG export for a generation image (PNG Export)", async () => {
    const ctx = await setup();
    const job = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      source: "generation",
      format: "png",
      sourceRefId: ctx.generationVersionId,
    });

    expect(job.status).toBe("pending");
    expect(job.sourceRefId).toBe(ctx.generationVersionId);
  });

  it("marks Free-plan exports as watermarked, Pro-plan exports as not (구독 제한 확인)", async () => {
    const ctx = await setup();
    ctx.subs.setPlan("user-1", "free");
    const freeJob = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      source: "concept_board",
      format: "pdf",
    });
    expect(freeJob.watermarked).toBe(true);

    ctx.subs.setPlan("user-1", "pro");
    const proJob = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      source: "concept_board",
      format: "pdf",
    });
    expect(proJob.watermarked).toBe(false);
  });

  it("rejects access from a user who doesn't own the project (권한 검증)", async () => {
    const ctx = await setup();
    await expect(
      ctx.create.execute({ projectId: ctx.projectId, userId: "someone-else", source: "concept_board", format: "pdf" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("ProcessExportJobUseCase / DownloadExportUseCase", () => {
  it("renders a Concept Board PDF end-to-end and makes it downloadable", async () => {
    const ctx = await setup();
    const job = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      source: "concept_board",
      format: "pdf",
    });

    await ctx.process.execute({ exportId: job.id, isFinalAttempt: true });

    const completed = await ctx.exportsRepo.getById(job.id);
    expect(completed?.status).toBe("completed");
    expect(completed?.fileKey).toBeTruthy();
    expect(ctx.usage.records).toHaveLength(1);
    expect(ctx.usage.records[0]?.eventType).toBe(EXPORT_EVENT_TYPE);

    const download = await ctx.download.execute({ exportId: job.id, userId: "user-1" });
    expect(download.contentType).toBe("application/pdf");
    expect(download.data.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("rejects downloading a job that hasn't completed yet", async () => {
    const ctx = await setup();
    const job = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      source: "concept_board",
      format: "pdf",
    });

    await expect(ctx.download.execute({ exportId: job.id, userId: "user-1" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });
});

describe("GetExportsUseCase / GetExportStatusUseCase", () => {
  it("lists export history and polls a single job's status", async () => {
    const ctx = await setup();
    const job = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      source: "concept_board",
      format: "pdf",
    });

    const list = await ctx.getExports.execute({ projectId: ctx.projectId, userId: "user-1" });
    expect(list).toHaveLength(1);

    const status = await ctx.getStatus.execute({ exportId: job.id, userId: "user-1" });
    expect(status.status).toBe("pending");
  });

  it("rejects access from a user who doesn't own the project", async () => {
    const ctx = await setup();
    const job = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      source: "concept_board",
      format: "pdf",
    });

    await expect(ctx.getStatus.execute({ exportId: job.id, userId: "someone-else" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
