import { describe, expect, it } from "vitest";
import { buildMockupBackgroundPrompt, PLACEHOLDER_SHAPES } from "@/shared/ai/mockupBackgroundGenerationRules";

describe("buildMockupBackgroundPrompt", () => {
  it("always injects the placeholder-mark and no-business-name rules", () => {
    const prompt = buildMockupBackgroundPrompt({
      category: "business_card",
      description: "warm minimal",
      shape: PLACEHOLDER_SHAPES[0],
      hasReferenceImage: false,
      containsKoreanText: false,
      isGeneric: false,
    });
    expect(prompt).toContain("CRITICAL RULE #1 (logo slot)");
    expect(prompt).toContain(PLACEHOLDER_SHAPES[0]);
    expect(prompt).toContain("CRITICAL RULE #2 (no fake brand names)");
  });

  it("applies the studio-backdrop simplicity clause for flat/print categories", () => {
    const prompt = buildMockupBackgroundPrompt({
      category: "poster",
      description: "bold modern",
      shape: PLACEHOLDER_SHAPES[1],
      hasReferenceImage: false,
      containsKoreanText: false,
      isGeneric: false,
    });
    expect(prompt).toContain("studio product photography");
    expect(prompt).toContain("At most one or two minimal");
  });

  it("applies the empty-storefront simplicity clause for signboard", () => {
    const prompt = buildMockupBackgroundPrompt({
      category: "signboard",
      description: "rustic",
      shape: PLACEHOLDER_SHAPES[2],
      hasReferenceImage: false,
      containsKoreanText: false,
      isGeneric: false,
    });
    expect(prompt).toContain("EMPTY or only minimally furnished");
  });

  it("skips the simplicity clause for categories not covered by rule 3c", () => {
    const prompt = buildMockupBackgroundPrompt({
      category: "mobile_app",
      description: "playful",
      shape: PLACEHOLDER_SHAPES[3],
      hasReferenceImage: false,
      containsKoreanText: false,
      isGeneric: false,
    });
    expect(prompt).not.toContain("CRITICAL RULE #3");
  });

  it("only adds the industry-agnostic clause when isGeneric is true", () => {
    const generic = buildMockupBackgroundPrompt({
      category: "banner",
      description: "dark luxury",
      shape: PLACEHOLDER_SHAPES[4],
      hasReferenceImage: false,
      containsKoreanText: false,
      isGeneric: true,
    });
    const specific = buildMockupBackgroundPrompt({
      category: "banner",
      description: "dark luxury",
      shape: PLACEHOLDER_SHAPES[4],
      hasReferenceImage: false,
      containsKoreanText: false,
      isGeneric: false,
    });
    expect(generic).toContain("CRITICAL RULE #4 (industry-agnostic)");
    expect(specific).not.toContain("CRITICAL RULE #4");
  });

  it("switches the incidental-text language line based on containsKoreanText", () => {
    const ko = buildMockupBackgroundPrompt({
      category: "leaflet",
      description: "x",
      shape: PLACEHOLDER_SHAPES[5],
      hasReferenceImage: false,
      containsKoreanText: true,
      isGeneric: false,
    });
    const en = buildMockupBackgroundPrompt({
      category: "leaflet",
      description: "x",
      shape: PLACEHOLDER_SHAPES[5],
      hasReferenceImage: false,
      containsKoreanText: false,
      isGeneric: false,
    });
    expect(ko).toContain("should be in Korean");
    expect(en).toContain("should be in English");
  });

  it("mentions the attached reference image only when one is provided", () => {
    const withRef = buildMockupBackgroundPrompt({
      category: "package",
      description: "x",
      shape: PLACEHOLDER_SHAPES[6],
      hasReferenceImage: true,
      containsKoreanText: false,
      isGeneric: false,
    });
    const withoutRef = buildMockupBackgroundPrompt({
      category: "package",
      description: "x",
      shape: PLACEHOLDER_SHAPES[6],
      hasReferenceImage: false,
      containsKoreanText: false,
      isGeneric: false,
    });
    expect(withRef).toContain("attached reference image");
    expect(withoutRef).not.toContain("attached reference image");
  });
});
