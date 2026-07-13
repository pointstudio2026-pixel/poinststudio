import { describe, expect, it } from "vitest";
import type { BrandBriefData } from "@/modules/brandBriefs/domain/BrandBrief";
import type { BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import type { Style } from "@/modules/styles/domain/Style";
import { composeConceptBoardData } from "@/modules/conceptBoards/domain/conceptBoardComposer";
import { CONCEPT_BOARD_SECTIONS } from "@/modules/conceptBoards/domain/ConceptBoard";

const BRIEF: BrandBriefData = {
  brandName: "Aster Bakery",
  industry: "bakery",
  tagline: "Aster Bakery — cozy",
  description: "fresh bread",
  mission: "fresh bread every morning",
  vision: "trusted bakery",
  coreValues: ["quality", "warmth"],
  positioning: "친근한 동네 베이커리",
  primaryAudience: "local families",
  secondaryAudience: "",
  customerProblems: "",
  desiredImpression: "cozy",
  brandTone: "따뜻한",
  brandPersonality: "친근한",
  keywords: ["bakery", "cozy"],
  avoidKeywords: [],
  preferredStyle: "미니멀",
  preferredColor: "따뜻한 베이지 톤",
  preferredSymbol: "심플한 심볼",
  typographyDirection: "가독성 높은 산세리프",
};

const STRATEGY: BrandStrategyData = {
  brandKnowledge: {
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
  styleCandidates: [{ name: "Minimal", reason: "" }],
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
  it("builds a brand summary referencing the brief and strategy", () => {
    const data = composeConceptBoardData({
      brief: BRIEF,
      strategy: STRATEGY,
      primaryStyle: null,
      secondaryStyles: [],
      latestGenerationImages: null,
    });

    expect(data.brandSummary).toContain("Aster Bakery");
    expect(data.brandSummary).toContain("동반자 (The Everyman)");
    expect(data.coreValues).toEqual(BRIEF.coreValues);
  });

  it("handles no generated images gracefully (이미지 없음)", () => {
    const data = composeConceptBoardData({
      brief: BRIEF,
      strategy: STRATEGY,
      primaryStyle: null,
      secondaryStyles: [],
      latestGenerationImages: null,
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
      brief: BRIEF,
      strategy: STRATEGY,
      primaryStyle: null,
      secondaryStyles: [],
      latestGenerationImages: images,
    });

    expect(data.heroImageUrl).toBe("url-1");
    expect(data.logoConceptImageUrls).toHaveLength(3);
  });

  it("dedupes style keywords across the brief and the selected style", () => {
    const data = composeConceptBoardData({
      brief: { ...BRIEF, keywords: ["bakery", "Monochrome Bold"] },
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
      latestGenerationImages: null,
    });

    expect(data.styleKeywords.filter((k) => k === "Monochrome Bold")).toHaveLength(1);
  });

  it("picks a warm color palette from a warm preferredColor description", () => {
    const data = composeConceptBoardData({
      brief: BRIEF,
      strategy: STRATEGY,
      primaryStyle: null,
      secondaryStyles: [],
      latestGenerationImages: null,
    });

    expect(data.colorPalette.length).toBeGreaterThan(0);
    expect(data.colorPalette.every((s) => /^#[0-9a-f]{6}$/i.test(s.hex))).toBe(true);
  });

  it("always returns the full section order", () => {
    const data = composeConceptBoardData({
      brief: BRIEF,
      strategy: STRATEGY,
      primaryStyle: null,
      secondaryStyles: [],
      latestGenerationImages: null,
    });

    expect(data.sectionOrder).toEqual(CONCEPT_BOARD_SECTIONS);
  });
});
