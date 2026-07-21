import { describe, expect, it } from "vitest";
import type { BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import type { Style } from "@/modules/styles/domain/Style";
import { composeConceptBoardData } from "@/modules/conceptBoards/domain/conceptBoardComposer";
import { CONCEPT_BOARD_SECTIONS } from "@/modules/conceptBoards/domain/ConceptBoard";

const ANSWERS: Record<string, string> = {
  brandName: "Aster Bakery",
  industry: "bakery",
};

const STRATEGY: BrandStrategyData = {
  brandKnowledge: {
    industry: "bakery",
    mission: "fresh bread",
    vision: "trusted bakery",
    values: ["quality"],
    positioning: "친근한 동네 베이커리",
    audience: "local families",
    tone: "따뜻한",
    personality: "친근한",
    visualDirection: "미니멀",
    confidenceNotes: "",
    reasoningSummary: "이 브랜드는 따뜻하고 친근한 방향으로 추천됩니다.",
    tagline: "Aster Bakery — cozy",
    keywords: ["bakery", "cozy"],
    preferredColor: "따뜻한 베이지 톤",
    typographyDirection: "가독성 높은 산세리프",
  },
  brandStrategy: {
    positioning: "친근한 동네 베이커리",
    coreMessage: "매일 아침 신선하게",
    toneAndManner: "따뜻한",
    personality: "친근한",
    brandArchetype: "동반자 (The Everyman)",
    visualDirection: "미니멀",
    recommendedStyles: [],
    recommendedColors: [],
    recommendedTypography: [],
    recommendedSymbols: [],
  },
  confidenceScore: 0.7,
};

const PRIMARY_STYLE: Style = {
  id: "style-1",
  name: "Monochrome Bold",
  slug: "minimal-monochrome-bold",
  level: 3,
  parentId: "parent-1",
  category: "Minimal",
  keywords: ["미니멀"],
  description: "설명",
};

describe("composeConceptBoardData", () => {
  it("builds a brand summary referencing the brand name and strategy", () => {
    const data = composeConceptBoardData({
      answers: ANSWERS,
      strategy: STRATEGY,
      primaryStyle: null,
      secondaryStyles: [],
      latestGenerationImages: null,
      selectedColorPalette: null,
      extractedColorPalette: null,
    });

    expect(data.brandSummary).toContain("Aster Bakery");
    expect(data.brandSummary).toContain("동반자 (The Everyman)");
    expect(data.coreValues).toEqual(STRATEGY.brandKnowledge.values);
  });

  it("handles no generated images gracefully (이미지 없음)", () => {
    const data = composeConceptBoardData({
      answers: ANSWERS,
      strategy: STRATEGY,
      primaryStyle: null,
      secondaryStyles: [],
      latestGenerationImages: null,
      selectedColorPalette: null,
      extractedColorPalette: null,
    });

    expect(data.heroImageUrl).toBeNull();
    expect(data.logoConceptImageUrls).toEqual([]);
  });

  it("selects a hero image and up to 3 logo concepts from generated images", () => {
    const images = [
      { url: "url-1", thumbnailUrl: "thumb-1" },
      { url: "url-2", thumbnailUrl: "thumb-2" },
      { url: "url-3", thumbnailUrl: "thumb-3" },
      { url: "url-4", thumbnailUrl: "thumb-4" },
    ];
    const data = composeConceptBoardData({
      answers: ANSWERS,
      strategy: STRATEGY,
      primaryStyle: null,
      secondaryStyles: [],
      latestGenerationImages: images,
      selectedColorPalette: null,
      extractedColorPalette: null,
    });

    expect(data.heroImageUrl).toBe("url-1");
    expect(data.logoConceptImageUrls).toHaveLength(3);
  });

  it("dedupes style keywords across brand knowledge and the selected style", () => {
    const strategyWithKeywords: BrandStrategyData = {
      ...STRATEGY,
      brandKnowledge: { ...STRATEGY.brandKnowledge, keywords: ["bakery", "Monochrome Bold"] },
    };
    const data = composeConceptBoardData({
      answers: ANSWERS,
      strategy: strategyWithKeywords,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
      latestGenerationImages: null,
      selectedColorPalette: null,
      extractedColorPalette: null,
    });

    expect(data.styleKeywords.filter((k) => k === "Monochrome Bold")).toHaveLength(1);
  });

  it("picks a warm color palette from a warm preferredColor description", () => {
    const data = composeConceptBoardData({
      answers: ANSWERS,
      strategy: STRATEGY,
      primaryStyle: null,
      secondaryStyles: [],
      latestGenerationImages: null,
      selectedColorPalette: null,
      extractedColorPalette: null,
    });

    expect(data.colorPalette.length).toBeGreaterThan(0);
    expect(data.colorPalette.every((s) => /^#[0-9a-f]{6}$/i.test(s.hex))).toBe(true);
  });

  it("prefers the user-selected color palette over everything else", () => {
    const selected = [{ hex: "#123456", label: "Selected" }];
    const extracted = [{ hex: "#abcdef", label: "Extracted" }];
    const data = composeConceptBoardData({
      answers: ANSWERS,
      strategy: STRATEGY,
      primaryStyle: null,
      secondaryStyles: [],
      latestGenerationImages: null,
      selectedColorPalette: selected,
      extractedColorPalette: extracted,
    });

    expect(data.colorPalette).toEqual(selected);
  });

  it("falls back to the extracted palette when nothing was selected", () => {
    const extracted = [{ hex: "#abcdef", label: "Extracted" }];
    const data = composeConceptBoardData({
      answers: ANSWERS,
      strategy: STRATEGY,
      primaryStyle: null,
      secondaryStyles: [],
      latestGenerationImages: null,
      selectedColorPalette: null,
      extractedColorPalette: extracted,
    });

    expect(data.colorPalette).toEqual(extracted);
  });

  it("falls back to the keyword-guess palette when neither selected nor extracted colors exist", () => {
    const data = composeConceptBoardData({
      answers: ANSWERS,
      strategy: STRATEGY,
      primaryStyle: null,
      secondaryStyles: [],
      latestGenerationImages: null,
      selectedColorPalette: null,
      extractedColorPalette: null,
    });

    expect(data.colorPalette.length).toBeGreaterThan(0);
    expect(data.colorPalette.every((s) => /^#[0-9a-f]{6}$/i.test(s.hex))).toBe(true);
  });

  it("always returns the full section order", () => {
    const data = composeConceptBoardData({
      answers: ANSWERS,
      strategy: STRATEGY,
      primaryStyle: null,
      secondaryStyles: [],
      latestGenerationImages: null,
      selectedColorPalette: null,
      extractedColorPalette: null,
    });

    expect(data.sectionOrder).toEqual(CONCEPT_BOARD_SECTIONS);
  });
});
