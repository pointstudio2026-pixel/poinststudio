import { describe, expect, it } from "vitest";
import type { BrandStrategyProfile } from "@/modules/brandStrategies/domain/BrandStrategy";
import type { Style } from "@/modules/styles/domain/Style";
import { buildPromptLayers, composePrompt } from "@/modules/prompts/domain/promptBuilder";
import { computePromptHash } from "@/modules/prompts/domain/promptHash";
import { applySafetyRules } from "@/modules/prompts/domain/promptSafety";
import { formatForProvider } from "@/modules/prompts/domain/providerFormatters";

const BRAND = {
  brandName: "Aster Bakery",
  industry: "bakery",
  mission: "We provide fresh handmade bread every morning",
  logoStyleNames: ["심볼 중심"],
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
    const layers = buildPromptLayers({ ...BRAND, strategy: STRATEGY, primaryStyle: PRIMARY_STYLE, secondaryStyles: [] });
    const { systemPrompt, userPrompt } = composePrompt(layers);

    expect(systemPrompt).toContain("ASTER");
    expect(systemPrompt).toContain("복제하거나 모방하지 않는다");
    expect(userPrompt).toContain(BRAND.brandName);
    expect(userPrompt).toContain(PRIMARY_STYLE.name);
    expect(userPrompt).not.toContain("복제하거나 모방하지 않는다");
  });

  it("produces identical output for identical inputs (동일 입력 재현)", () => {
    const layersA = buildPromptLayers({ ...BRAND, strategy: STRATEGY, primaryStyle: PRIMARY_STYLE, secondaryStyles: [] });
    const layersB = buildPromptLayers({ ...BRAND, strategy: STRATEGY, primaryStyle: PRIMARY_STYLE, secondaryStyles: [] });
    const promptA = composePrompt(layersA);
    const promptB = composePrompt(layersB);

    expect(promptA.systemPrompt).toBe(promptB.systemPrompt);
    expect(promptA.userPrompt).toBe(promptB.userPrompt);
  });

  it("changes the user prompt when the selected style changes (스타일 변경)", () => {
    const layersA = buildPromptLayers({ ...BRAND, strategy: STRATEGY, primaryStyle: PRIMARY_STYLE, secondaryStyles: [] });
    const layersB = buildPromptLayers({
      ...BRAND,
      strategy: STRATEGY,
      primaryStyle: { ...PRIMARY_STYLE, name: "Swiss Bold", category: "Modern" },
      secondaryStyles: [],
    });
    expect(composePrompt(layersA).userPrompt).not.toBe(composePrompt(layersB).userPrompt);
  });

  it("changes the user prompt when the brand name changes (브랜드명 변경)", () => {
    const layersA = buildPromptLayers({ ...BRAND, strategy: STRATEGY, primaryStyle: PRIMARY_STYLE, secondaryStyles: [] });
    const layersB = buildPromptLayers({
      ...BRAND,
      brandName: "Different Bakery",
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
    });
    expect(composePrompt(layersA).userPrompt).not.toBe(composePrompt(layersB).userPrompt);
  });
});

describe("buildPromptLayers -- 내 스타일(userStyleDescription)", () => {
  it("includes the user style description in the user prompt when provided", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
      userStyleDescription: "미니멀한 라인 아트, 파스텔 톤",
    });
    const { userPrompt } = composePrompt(layers);
    expect(userPrompt).toContain("미니멀한 라인 아트, 파스텔 톤");
  });

  it("omits the user style line entirely when no category was selected", () => {
    const layers = buildPromptLayers({ ...BRAND, strategy: STRATEGY, primaryStyle: PRIMARY_STYLE, secondaryStyles: [] });
    expect(layers.userStyleContext).toBe("");
    const { userPrompt } = composePrompt(layers);
    expect(userPrompt).not.toContain("사용자 지정 스타일 참고");
  });
});

describe("buildPromptLayers -- baseTemplateContext(유형×스타일 고정 뼈대)", () => {
  it("includes the style category's fixed template phrase in the user prompt", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      strategy: STRATEGY,
      primaryStyle: { ...PRIMARY_STYLE, category: "미니멀" },
      secondaryStyles: [],
    });
    expect(layers.baseTemplateContext).toContain("스칸디나비안");
    const { userPrompt } = composePrompt(layers);
    expect(userPrompt).toContain("스칸디나비안");
  });

  it("changes when the style category changes, even with the same deliverable type (스타일별로 다른 고정값)", () => {
    const minimal = buildPromptLayers({
      ...BRAND,
      strategy: STRATEGY,
      primaryStyle: { ...PRIMARY_STYLE, category: "미니멀" },
      secondaryStyles: [],
    });
    const luxury = buildPromptLayers({
      ...BRAND,
      strategy: STRATEGY,
      primaryStyle: { ...PRIMARY_STYLE, category: "럭셔리" },
      secondaryStyles: [],
    });
    expect(minimal.baseTemplateContext).not.toBe(luxury.baseTemplateContext);
  });

  it("omits the line entirely when the style category has no matching template", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      strategy: STRATEGY,
      primaryStyle: { ...PRIMARY_STYLE, category: "존재하지-않는-카테고리" },
      secondaryStyles: [],
    });
    expect(layers.baseTemplateContext).toBe("");
  });
});

describe("buildPromptLayers -- industryContext(업종별 고정 뼈대)", () => {
  it("includes the industry's fixed visual-convention phrase in the user prompt", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      industry: "카페/커피",
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
    });
    expect(layers.industryContext).toContain("업종 특성");
    expect(layers.industryContext).toContain("우드톤");
    const { userPrompt } = composePrompt(layers);
    expect(userPrompt).toContain("우드톤");
  });

  it("changes when the industry changes (업종별로 다른 고정값)", () => {
    const cafe = buildPromptLayers({
      ...BRAND,
      industry: "카페/커피",
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
    });
    const finance = buildPromptLayers({
      ...BRAND,
      industry: "금융",
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
    });
    expect(cafe.industryContext).not.toBe(finance.industryContext);
  });

  it("omits the line entirely for an unrecognized industry (기타 포함)", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      industry: "기타",
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
    });
    expect(layers.industryContext).toBe("");
  });
});

describe("buildPromptLayers -- typographyContext(작업물 유형별 폰트 크기 지침)", () => {
  it("gives the 8~9pt 명함 ceiling for business cards", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      deliverableType: "명함",
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
    });
    expect(layers.typographyContext).toContain("8~9pt");
    const { userPrompt } = composePrompt(layers);
    expect(userPrompt).toContain("8~9pt");
  });

  it("differs between deliverable types (유형별로 다른 타이포그래피 지침)", () => {
    const businessCard = buildPromptLayers({
      ...BRAND,
      deliverableType: "명함",
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
    });
    const poster = buildPromptLayers({
      ...BRAND,
      deliverableType: "포스터",
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
    });
    expect(businessCard.typographyContext).not.toBe(poster.typographyContext);
  });

  it("falls back to the logo guidance when no deliverable type is given", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
    });
    expect(layers.typographyContext).toContain("워드마크");
  });
});

describe("buildPromptLayers -- 스타일별 타이포 스케일 톤(dominant/balanced/quiet)", () => {
  it("gives a dominant, magazine-scale headline clause for 에디토리얼 posters (패션 매거진식)", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      deliverableType: "포스터",
      strategy: STRATEGY,
      primaryStyle: { ...PRIMARY_STYLE, category: "에디토리얼" },
      secondaryStyles: [],
    });
    expect(layers.typographyContext).toContain("80~100%");
  });

  it("gives a quiet, small-logo clause for 미니멀 posters (감성 카페식)", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      deliverableType: "포스터",
      strategy: STRATEGY,
      primaryStyle: { ...PRIMARY_STYLE, category: "미니멀" },
      secondaryStyles: [],
    });
    expect(layers.typographyContext).toContain("5~12%");
    expect(layers.typographyContext).toContain("여백");
  });

  it("does not apply a scale-tier clause to 명함 (format/print rules take precedence over mood)", () => {
    const dominant = buildPromptLayers({
      ...BRAND,
      deliverableType: "명함",
      strategy: STRATEGY,
      primaryStyle: { ...PRIMARY_STYLE, category: "에디토리얼" },
      secondaryStyles: [],
    });
    const quiet = buildPromptLayers({
      ...BRAND,
      deliverableType: "명함",
      strategy: STRATEGY,
      primaryStyle: { ...PRIMARY_STYLE, category: "미니멀" },
      secondaryStyles: [],
    });
    expect(dominant.typographyContext).toBe(quiet.typographyContext);
  });
});

describe("buildPromptLayers -- 공통 폰트 페어링 규칙", () => {
  it("limits typefaces to 2 and requires contrast, in the shared system instructions", () => {
    const layers = buildPromptLayers({ ...BRAND, strategy: STRATEGY, primaryStyle: PRIMARY_STYLE, secondaryStyles: [] });
    expect(layers.systemInstructions).toContain("최대 2종");
  });
});

describe("buildPromptLayers -- 로고 클리어 스페이스", () => {
  it("requires clear space around the logo mark", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
    });
    expect(layers.generationObjective).toContain("클리어 스페이스");
  });
});

describe("buildPromptLayers -- colorContext 60-30-10 배분", () => {
  it("adds a 60-30-10 proportion clause when 2 or more swatches are given", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
      colorPaletteSwatches: [
        { hex: "#7c2d12", label: "Terracotta" },
        { hex: "#f97316", label: "Amber" },
      ],
    });
    expect(layers.colorContext).toContain("60-30-10");
    expect(layers.colorContext).toContain("Terracotta");
  });

  it("omits the proportion clause for a single swatch (배분 자체가 의미 없음)", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
      colorPaletteSwatches: [{ hex: "#7c2d12", label: "Terracotta" }],
    });
    expect(layers.colorContext).not.toContain("60-30-10");
  });
});

describe("buildPromptLayers -- 명함 앞뒷면 / 리플렛 6패널 예외", () => {
  it("requires a front+back layout for business cards", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      deliverableType: "명함",
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
    });
    expect(layers.generationObjective).toContain("앞면과 뒷면");
  });

  it("requires a 6-panel unfolded tri-fold strip for leaflets", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      deliverableType: "리플렛",
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
    });
    expect(layers.generationObjective).toContain("6개 패널");
  });

  it("names both exceptions in the shared quality directive so they don't read as a rule violation", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
    });
    expect(layers.systemInstructions).toContain("명함");
    expect(layers.systemInstructions).toContain("리플렛");
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

  it("defaults to square when sizePreset is omitted (backward compatible)", () => {
    const openai = formatForProvider("openai", "s", "u");
    expect(openai.sizePreset).toBe("square");
    expect(openai.parameters.size).toBe("1024x1024");
  });

  it("maps sizePreset to the correct OpenAI size string", () => {
    expect(formatForProvider("openai", "s", "u", "portrait").parameters.size).toBe("1024x1536");
    expect(formatForProvider("openai", "s", "u", "landscape").parameters.size).toBe("1536x1024");
    expect(formatForProvider("openai", "s", "u", "square").parameters.size).toBe("1024x1024");
  });

  it("maps sizePreset to the correct Gemini aspect ratio", () => {
    expect(formatForProvider("gemini", "s", "u", "portrait").parameters.aspectRatio).toBe("3:4");
    expect(formatForProvider("gemini", "s", "u", "landscape").parameters.aspectRatio).toBe("4:3");
    expect(formatForProvider("gemini", "s", "u", "square").parameters.aspectRatio).toBe("1:1");
  });
});

describe("buildPromptLayers -- additionalNotes(그 외 사항: 무조건 포함/제외)", () => {
  it("includes a must-follow directive in the user prompt when additionalNotes is provided", () => {
    const layers = buildPromptLayers({
      ...BRAND,
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
      additionalNotes: "로고에 동물 캐릭터는 절대 넣지 않는다",
    });
    expect(layers.additionalRequirementsContext).toContain("로고에 동물 캐릭터는 절대 넣지 않는다");
    const { userPrompt } = composePrompt(layers);
    expect(userPrompt).toContain("반드시 지킨다");
    expect(userPrompt).toContain("로고에 동물 캐릭터는 절대 넣지 않는다");
  });

  it("omits the layer entirely when additionalNotes is empty or missing", () => {
    const layers = buildPromptLayers({ ...BRAND, strategy: STRATEGY, primaryStyle: PRIMARY_STYLE, secondaryStyles: [] });
    expect(layers.additionalRequirementsContext).toBe("");

    const withBlank = buildPromptLayers({
      ...BRAND,
      strategy: STRATEGY,
      primaryStyle: PRIMARY_STYLE,
      secondaryStyles: [],
      additionalNotes: "   ",
    });
    expect(withBlank.additionalRequirementsContext).toBe("");
  });
});
