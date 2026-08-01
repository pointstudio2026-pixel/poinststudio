import { describe, expect, it } from "vitest";
import { GenerateFromLogoAssetUseCase } from "@/modules/generations/application/GenerateFromLogoAssetUseCase";
import { FakeFileStorage } from "@/shared/storage/testing/FakeFileStorage";
import type { LogoPreservingImageProvider, LogoPreservingImageRequest } from "@/shared/ai/LogoPreservingImageProvider";
import type { ProjectLogoAsset } from "@/modules/projectLogos/domain/ProjectLogoAsset";
import { InternalError } from "@/shared/errors/AppError";

function capturingProvider(): { provider: LogoPreservingImageProvider; captured: LogoPreservingImageRequest[] } {
  const captured: LogoPreservingImageRequest[] = [];
  return {
    captured,
    provider: {
      name: "capturing",
      async generate(request) {
        captured.push(request);
        return {
          images: [{ url: "data:image/png;base64,X", thumbnailUrl: "data:image/png;base64,X" }],
          provider: "capturing",
          model: "capturing-model",
          costAmount: 0.053,
        };
      },
    },
  };
}

async function setup() {
  const fileStorage = new FakeFileStorage();
  const { provider, captured } = capturingProvider();

  const saved = await fileStorage.save("project-logos/project-1/logo", Buffer.from("fake-logo-bytes"), "image/png");
  const logoAsset: ProjectLogoAsset = {
    id: "logo-1",
    projectId: "project-1",
    storageKey: saved.key,
    contentType: "image/png",
    originalFileName: "logo.png",
    confirmed: true,
    createdAt: new Date(),
  };

  const useCase = new GenerateFromLogoAssetUseCase(fileStorage, provider);

  return { fileStorage, provider, captured, logoAsset, useCase };
}

describe("GenerateFromLogoAssetUseCase", () => {
  it("passes the same systemPrompt/userPrompt a logo-less generation would use, plus the real logo pixels", async () => {
    const ctx = await setup();

    const result = await ctx.useCase.execute({
      logoAsset: ctx.logoAsset,
      systemPrompt: "system instructions",
      userPrompt: "brand-specific content",
      sizePreset: "portrait",
    });

    expect(ctx.captured).toHaveLength(1);
    expect(ctx.captured[0]?.systemPrompt).toBe("system instructions");
    expect(ctx.captured[0]?.userPrompt).toBe("brand-specific content");
    expect(ctx.captured[0]?.sizePreset).toBe("portrait");
    expect(ctx.captured[0]?.logoImageUrl).toBe("data:image/png;base64,ZmFrZS1sb2dvLWJ5dGVz");
    expect(result.images).toEqual([{ url: "data:image/png;base64,X", thumbnailUrl: "data:image/png;base64,X" }]);
    expect(result.provider).toBe("capturing");
    expect(result.costAmount).toBe(0.053);
  });

  it("does not touch any mockup template -- no category/industry/style lookups are performed", async () => {
    const ctx = await setup();

    await ctx.useCase.execute({
      logoAsset: ctx.logoAsset,
      systemPrompt: "system instructions",
      userPrompt: "brand-specific content",
    });

    // The captured request carries only prompt + logo -- nothing template-shaped.
    expect(Object.keys(ctx.captured[0]!)).toEqual(["logoImageUrl", "systemPrompt", "userPrompt", "sizePreset"]);
  });

  it("throws when the logo file is missing from storage", async () => {
    const ctx = await setup();
    const missingAsset: ProjectLogoAsset = { ...ctx.logoAsset, storageKey: "does-not-exist.png" };

    await expect(
      ctx.useCase.execute({ logoAsset: missingAsset, systemPrompt: "s", userPrompt: "u" }),
    ).rejects.toThrow(InternalError);
  });
});
