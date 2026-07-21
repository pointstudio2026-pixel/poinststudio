import { describe, expect, it } from "vitest";
import { MockImageGenerationProvider } from "@/shared/ai/MockImageGenerationProvider";

function decodeSvgDimensions(dataUri: string): { width: number; height: number } {
  const base64 = dataUri.slice(dataUri.indexOf(",") + 1);
  const svg = Buffer.from(base64, "base64").toString("utf-8");
  const width = Number(svg.match(/width="(\d+)"/)?.[1]);
  const height = Number(svg.match(/height="(\d+)"/)?.[1]);
  return { width, height };
}

describe("MockImageGenerationProvider", () => {
  it("generates square images when sizePreset is omitted (default)", async () => {
    const provider = new MockImageGenerationProvider();
    const { images } = await provider.generate({ systemPrompt: "s", userPrompt: "u", count: 1 });

    const { width, height } = decodeSvgDimensions(images[0]!.url);
    expect(width).toBe(height);
  });

  it("generates a taller-than-wide image for portrait", async () => {
    const provider = new MockImageGenerationProvider();
    const { images } = await provider.generate({
      systemPrompt: "s",
      userPrompt: "u",
      count: 1,
      sizePreset: "portrait",
    });

    const { width, height } = decodeSvgDimensions(images[0]!.url);
    expect(height).toBeGreaterThan(width);
  });

  it("generates a wider-than-tall image for landscape", async () => {
    const provider = new MockImageGenerationProvider();
    const { images } = await provider.generate({
      systemPrompt: "s",
      userPrompt: "u",
      count: 1,
      sizePreset: "landscape",
    });

    const { width, height } = decodeSvgDimensions(images[0]!.url);
    expect(width).toBeGreaterThan(height);
  });

  it("keeps the same prompt+sizePreset combination deterministic", async () => {
    const provider = new MockImageGenerationProvider();
    const first = await provider.generate({ systemPrompt: "s", userPrompt: "u", count: 1, sizePreset: "portrait" });
    const second = await provider.generate({ systemPrompt: "s", userPrompt: "u", count: 1, sizePreset: "portrait" });
    expect(first.images[0]!.url).toBe(second.images[0]!.url);
  });
});
