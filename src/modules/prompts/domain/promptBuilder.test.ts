import { describe, expect, it } from "vitest";
import type { BrandBriefData } from "@/modules/brandBriefs/domain/BrandBrief";
import type { BrandStrategyProfile } from "@/modules/brandStrategies/domain/BrandStrategy";
import type { Style } from "@/modules/styles/domain/Style";
import { buildPromptLayers, composePrompt } from "@/modules/prompts/domain/promptBuilder";
import { computePromptHash } from "@/modules/prompts/domain/promptHash";
import { applySafetyRules } from "@/modules/prompts/domain/promptSafety";
import { formatForProvider } from "@/modules/prompts/domain/providerFormatters";

const BRIEF: BrandBriefData = {
  brandName: "Aster Bakery",
  industry: "bakery",
  tagline: "Aster Bakery — cozy",
  description: "fresh bread",
  mission: "We provide fresh handmade bread every morning",
  vision: "trusted neighborhood bakery",
  coreValues: ["quality"],
  positioning: "친근한 동네 베이커리",
  primaryAudience: "local families",
  secondaryAudience: "",
  customerProblems: "",
  desiredImpression: "cozy and minimal",
  brandTone: "친근하고 따뜻한",
  brandPersonality: "친근하고 따뜻한",
  keywords: ["bakery"],
  avoidKeywords: [],
  preferredStyle: "미니멀",
  preferredColor: "중성 컬러",
  preferredSymbol: "심플한 심볼",
  typographyDirection: "산세리프",
};

const STRATEGY: BrandStrategyProfile = {
  positioning: "친근한 동네 베이커리",
  coreMessage: "매일 아침 신선하게",
  toneAndManner: "친근하고 따뜻한",
  personality: "친근하고 따뜻한",
  brandArchetype: "동반자 (The Everyman)",
  visualDirection: "미니멀, 중성 컬러",
  recommendedStyles: [],
  recommendedColors: [],
  recommendedTypography: [],
  recommendedSymbols: [],
};

const PRIMARY_STYLE: Style = {
  id: "style-1",
  name: "Monochrome Bold",
  slug: "minimal-monochrome-bold",
  level: 3,
  parentId: "parent-1",
  category: "Minimal",
  keywords: ["미니멀"],
  description: "Minimal 계열의 Monochrome 스타일에 Bold 느낌을 더한 디자인 방향입니다.",
};

describe("buildPromptLayers / composePrompt", () => {
  it("separates system prompt (instructions+safety) from user prompt (brand+style+objective)", () => {
    const layers = buildPromptLayers({ brief: BRIEF, strategy: STRATEGY, primaryStyle: PRIMARY_STYLE, secondaryStyles: [] });
    const { systemPrompt, userPrompt } = composePrompt(layers);

    expect(systemPrompt).toContain("ASTER");
    expect(systemPrompt).toContain("복제하거나 모방하지 않는다");
    expect(userPrompt).toContain(BRIEF.brandName);
    expect(userPrompt).toContain(PRIMARY_STYLE.name);
    expect(userPrompt).not.toContain("복제하거나 모방하지 않는다");
  });

  it("produces identical output for identical inputs (동일 입력 재현)", () => {
    const layersA = buildPromptLayers({ brief: BRIEF, strategy: STRATEGY, primaryStyle: PRIMARY_STYLE, secondaryStyles: [] });
    const layersB = buildPromptLayers({ brief: BRIEF, strategy: STRATEGY, primaryStyle: PRIMARY_STYLE, secondaryStyles: [] });
    const promptA = composePrompt(layersA);
    const promptB = composePrompt(layersB);

    expect(promptA.systemPrompt).toBe(promptB.systemPrompt);
    expect(promptA.userPrompt).toBe(promptB.userPrompt);
  });

  it("changes the user prompt when the selected style changes (스타일 변경)", () => {
    const layersA = buildPromptLayers({ brief: BRIEF, strategy: STRATEGY, primaryStyle: PRIMARY_STYLE, secondaryStyles: [] });
    const layersB = buildPromptLayers({
      brief: BRIEF,
      strategy: STRATEGY,
      primaryStyle: { ...PRIMARY_STYLE, name: "Swiss Bold", category: "Modern" },
      secondaryStyles: [],
    });
    expect(composePrompt(layersA).userPrompt).not.toBe(composePrompt(layersB).userPrompt);
  });

  it("changes the user prompt when the Brand Brief changes (Brand Brief 변경)", () => {
    const layersA = buildPromptLayers({ brief: BRIEF, strategy: STRATEGY, primaryStyle: PRIMARY_STYLE, secondaryStyles: [] });
    const layersB = buildPromptLayers({
      brief: { ...BRIEF, brandName: "Different Bakery" },
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
    });
    expect(composePrompt(layersA).userPrompt).not.toBe(composePrompt(layersB).userPrompt);
  });
});

describe("applySafetyRules", () => {
  it("generalizes a known trademark reference (금지어 포함 입력)", () => {
    const result = applySafetyRules("나이키 로고 스타일로 만들어줘");
    expect(result.text).not.toContain("나이키");
    expect(result.flaggedTerms.length).toBeGreaterThan(0);
  });

  it("leaves ordinary text unchanged", () => {
    const result = applySafetyRules("미니멀하고 따뜻한 베이커리 로고");
    expect(result.text).toBe("미니멀하고 따뜻한 베이커리 로고");
    expect(result.flaggedTerms).toEqual([]);
  });
});

describe("computePromptHash", () => {
  it("is identical for identical inputs (Prompt Hash 동일성)", () => {
    const hashA = computePromptHash("system", "user", "openai");
    const hashB = computePromptHash("system", "user", "openai");
    expect(hashA).toBe(hashB);
    expect(hashA).toHaveLength(64);
  });

  it("changes when the provider changes (Provider 변경)", () => {
    const hashOpenAi = computePromptHash("system", "user", "openai");
    const hashGemini = computePromptHash("system", "user", "gemini");
    expect(hashOpenAi).not.toBe(hashGemini);
  });
});

describe("formatForProvider", () => {
  it("produces a distinct payload shape per provider", () => {
    const openai = formatForProvider("openai", "s", "u");
    const gemini = formatForProvider("gemini", "s", "u");
    const nanobanana = formatForProvider("nanobanana", "s", "u");

    expect(openai.model).not.toBe(gemini.model);
    expect(gemini.model).not.toBe(nanobanana.model);
    expect(openai.parameters).not.toEqual(gemini.parameters);
  });
});
