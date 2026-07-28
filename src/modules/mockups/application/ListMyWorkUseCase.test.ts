import { describe, expect, it } from "vitest";
import { ListMyWorkUseCase } from "@/modules/mockups/application/ListMyWorkUseCase";
import { FakeGenerationRepository } from "@/modules/generations/testing/fakes";
import { FakeStandaloneMockupRepository } from "@/modules/mockups/testing/fakes";

describe("ListMyWorkUseCase", () => {
  it("merges generation images and completed standalone mockups, newest first", async () => {
    const generations = new FakeGenerationRepository();
    const standaloneMockups = new FakeStandaloneMockupRepository();

    generations.generations.set("gen-1", { id: "gen-1", projectId: "project-1" });
    generations.projectOwners.set("project-1", { userId: "user-1", projectName: "My Brand" });
    generations.versions.push({
      id: "version-1",
      generationId: "gen-1",
      versionNumber: 1,
      promptVersionId: "prompt-1",
      status: "completed",
      provider: "openai",
      providerPreference: null,
      images: [{ url: "https://example.com/a.png", thumbnailUrl: "https://example.com/a-thumb.png" }],
      errorMessage: null,
      costAmount: 0.05,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      completedAt: new Date("2026-01-01T00:00:00Z"),
    });

    await standaloneMockups.create({
      userId: "user-1",
      projectId: "shell-project-1",
      templateId: "template-1",
      sourceType: "upload",
      status: "completed",
      resultImageUrl: "https://example.com/mockup.png",
      thumbnailUrl: null,
      provider: "openai",
      costAmount: 0.05,
    });
    // A failed mockup for the same user must never surface in "내 작업물".
    await standaloneMockups.create({
      userId: "user-1",
      projectId: "shell-project-2",
      templateId: "template-1",
      sourceType: "upload",
      status: "failed",
      errorMessage: "boom",
    });
    // Another user's completed mockup must never leak into user-1's list.
    await standaloneMockups.create({
      userId: "user-2",
      projectId: "shell-project-3",
      templateId: "template-1",
      sourceType: "upload",
      status: "completed",
      resultImageUrl: "https://example.com/other-user.png",
    });

    const items = await new ListMyWorkUseCase(generations, standaloneMockups).execute("user-1");

    expect(items).toHaveLength(2);
    expect(items.some((i) => i.sourceType === "generation" && i.imageUrl === "https://example.com/a.png")).toBe(true);
    expect(
      items.some((i) => i.sourceType === "standalone_mockup" && i.imageUrl === "https://example.com/mockup.png"),
    ).toBe(true);
  });

  it("returns an empty list for a user with no generations or mockups", async () => {
    const generations = new FakeGenerationRepository();
    const standaloneMockups = new FakeStandaloneMockupRepository();
    const items = await new ListMyWorkUseCase(generations, standaloneMockups).execute("user-with-nothing");
    expect(items).toEqual([]);
  });
});
