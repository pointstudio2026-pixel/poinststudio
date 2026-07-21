import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { extractDominantColors } from "@/modules/conceptBoards/infrastructure/dominantColorExtractor";
import { MockImageGenerationProvider } from "@/shared/ai/MockImageGenerationProvider";

async function solidColorDataUri(hex: string): Promise<string> {
  const rgb = {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
  const buffer = await sharp({
    create: { width: 8, height: 8, channels: 3, background: rgb },
  })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

describe("extractDominantColors", () => {
  it("extracts a color close to a known solid-color image", async () => {
    const dataUri = await solidColorDataUri("#3366cc");

    const result = await extractDominantColors(dataUri, 1);

    expect(result).not.toBeNull();
    expect(result![0]!.hex).toMatch(/^#[0-9a-f]{6}$/i);
    // 양자화 오차 범위 내에서 근접해야 한다(정확히 일치하지 않아도 된다).
    const extracted = result![0]!.hex.slice(1);
    const r = parseInt(extracted.slice(0, 2), 16);
    expect(Math.abs(r - 0x33)).toBeLessThan(40);
  });

  it("returns null for a malformed data URI instead of throwing", async () => {
    const result = await extractDominantColors("data:image/png;base64,not-a-real-image", 3);
    expect(result).toBeNull();
  });

  it("returns null for an unreachable URL instead of throwing", async () => {
    const result = await extractDominantColors("https://example.invalid/does-not-exist.png", 3);
    expect(result).toBeNull();
  });

  it("does not throw on the Mock image provider's SVG data URI output", async () => {
    const provider = new MockImageGenerationProvider();
    const { images } = await provider.generate({
      systemPrompt: "system",
      userPrompt: "test prompt",
      count: 1,
    });

    const result = await extractDominantColors(images[0]!.url, 3);
    expect(result === null || Array.isArray(result)).toBe(true);
  });
});
