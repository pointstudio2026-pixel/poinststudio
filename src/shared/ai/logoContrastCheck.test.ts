import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { checkLogoBackgroundContrast } from "@/shared/ai/logoContrastCheck";

async function solidPng(width: number, height: number, rgb: { r: number; g: number; b: number }): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: rgb } }).png().toBuffer();
}

/** Mostly `base` with a `accent` rectangle covering roughly `accentShare` of the image. */
async function withAccentRect(
  width: number,
  height: number,
  base: { r: number; g: number; b: number },
  accent: { r: number; g: number; b: number },
  accentShare: number,
): Promise<Buffer> {
  const accentHeight = Math.max(1, Math.round(height * accentShare));
  const overlay = await sharp({ create: { width, height: accentHeight, channels: 3, background: accent } })
    .png()
    .toBuffer();
  return sharp({ create: { width, height, channels: 3, background: base } })
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toBuffer();
}

/** A logo file with NO transparency (like a JPG export): `background` fills
 * the whole canvas (including all 4 corners), with an `ink` rectangle
 * inset in the middle -- models a real opaque logo export sitting on a
 * visible background/canvas color. */
async function opaqueLogoWithBackground(
  canvas: number,
  background: { r: number; g: number; b: number },
  ink: { r: number; g: number; b: number },
): Promise<Buffer> {
  const inkSize = Math.round(canvas * 0.4);
  const overlay = await sharp({ create: { width: inkSize, height: inkSize, channels: 3, background: ink } })
    .png()
    .toBuffer();
  const offset = Math.round((canvas - inkSize) / 2);
  return sharp({ create: { width: canvas, height: canvas, channels: 3, background } })
    .composite([{ input: overlay, top: offset, left: offset }])
    .png()
    .toBuffer();
}

/** A logo with two large, roughly equal-sized, clearly different-colored
 * regions -- a genuinely multi-color mark (transparent margin via alpha,
 * like a real exported PNG logo). */
async function twoColorLogo(canvas: number, colorA: { r: number; g: number; b: number }, colorB: { r: number; g: number; b: number }): Promise<Buffer> {
  const half = Math.round(canvas / 2);
  const leftHalf = await sharp({ create: { width: half, height: canvas, channels: 4, background: { ...colorA, alpha: 1 } } })
    .png()
    .toBuffer();
  const rightHalf = await sharp({ create: { width: canvas - half, height: canvas, channels: 4, background: { ...colorB, alpha: 1 } } })
    .png()
    .toBuffer();
  return sharp({ create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: leftHalf, top: 0, left: 0 },
      { input: rightHalf, top: 0, left: half },
    ])
    .png()
    .toBuffer();
}

const BLACK = { r: 10, g: 10, b: 10 };
const WHITE = { r: 245, g: 245, b: 245 };
const GOLD = { r: 201, g: 166, b: 107 }; // #C9A66B-ish

describe("checkLogoBackgroundContrast", () => {
  it("recommends no adjustment when the logo already has enough contrast", async () => {
    const logo = await solidPng(64, 64, BLACK);
    const background = await solidPng(200, 200, WHITE);
    const result = await checkLogoBackgroundContrast(logo, background);
    expect(result?.needsAdjustment).toBe(false);
    expect(result?.recommendedTone).toBeNull();
  });

  it("recommends the background's actual accent color when one is prominent enough, instead of flat white/black", async () => {
    const logo = await solidPng(64, 64, BLACK); // black logo
    // mostly-black background (like a dark storefront sign) with a gold trim band covering 15% of it
    const background = await withAccentRect(200, 200, BLACK, GOLD, 0.15);
    const result = await checkLogoBackgroundContrast(logo, background);
    expect(result?.needsAdjustment).toBe(true);
    expect(result?.recommendedTone?.kind).toBe("accent");
    if (result?.recommendedTone?.kind === "accent") {
      // sampled/quantized, so allow some drift from the exact input color
      expect(result.recommendedTone.hex).toMatch(/^#[0-9a-f]{6}$/i);
      expect(result.recommendedTone.hex.toLowerCase()).not.toBe("#ffffff");
      expect(result.recommendedTone.hex.toLowerCase()).not.toBe("#000000");
    }
  });

  it("falls back to white on a uniformly dark background with no real accent color", async () => {
    const logo = await solidPng(64, 64, BLACK);
    const background = await solidPng(200, 200, BLACK);
    const result = await checkLogoBackgroundContrast(logo, background);
    expect(result?.needsAdjustment).toBe(true);
    expect(result?.recommendedTone).toEqual({ kind: "white" });
  });

  it("falls back to black on a uniformly light background with no real accent color", async () => {
    // note: the logo color extractor deliberately excludes near-white pixels
    // (r/g/b > 240) as presumed canvas padding around a logo mark, so a
    // genuinely near-white logo needs a shade just under that threshold to
    // register as "the logo's own color" for this test.
    const lightGrayLogo = { r: 230, g: 230, b: 230 };
    const logo = await solidPng(64, 64, lightGrayLogo);
    const background = await solidPng(200, 200, WHITE);
    const result = await checkLogoBackgroundContrast(logo, background);
    expect(result?.needsAdjustment).toBe(true);
    expect(result?.recommendedTone).toEqual({ kind: "black" });
  });

  it("ignores an accent color that's too rare to be a real scene tone (just a few stray pixels)", async () => {
    const logo = await solidPng(64, 64, BLACK);
    // gold rectangle covering well under the 2% minimum-share threshold
    const background = await withAccentRect(200, 200, BLACK, GOLD, 0.002);
    const result = await checkLogoBackgroundContrast(logo, background);
    expect(result?.needsAdjustment).toBe(true);
    expect(result?.recommendedTone).toEqual({ kind: "white" });
  });

  it("skips color adjustment entirely for a genuinely multi-color logo, even with poor contrast", async () => {
    // half red, half blue -- clearly two real colors, transparent margin
    const logo = await twoColorLogo(64, { r: 200, g: 30, b: 30 }, { r: 30, g: 30, b: 200 });
    const background = await solidPng(200, 200, BLACK); // low contrast for at least one half
    const result = await checkLogoBackgroundContrast(logo, background);
    expect(result?.needsAdjustment).toBe(false);
    expect(result?.recommendedTone).toBeNull();
    expect(result?.contrastRatio).toBeNull();
  });

  it("excludes an opaque logo file's own background color (JPG-style, no alpha) instead of counting it as a second logo color", async () => {
    // white canvas background with a black ink square inset -- if the
    // white canvas were wrongly counted as "logo color", this would look
    // like a 2-color (white+black) logo and get skipped as multi-color.
    const logo = await opaqueLogoWithBackground(64, WHITE, BLACK);
    const background = await solidPng(200, 200, BLACK); // black logo ink on black background -> needs adjustment
    const result = await checkLogoBackgroundContrast(logo, background);
    expect(result?.needsAdjustment).toBe(true);
    expect(result?.recommendedTone).toEqual({ kind: "white" });
  });
});
