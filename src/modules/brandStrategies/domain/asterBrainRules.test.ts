import { describe, expect, it } from "vitest";
import type { BrandBriefData } from "@/modules/brandBriefs/domain/BrandBrief";
import {
  buildBrandKnowledge,
  buildStrategyProfile,
  buildStyleCandidates,
  calculateConfidence,
} from "@/modules/brandStrategies/domain/asterBrainRules";

const BRIEF: BrandBriefData = {
  brandName: "Aster Coffee",
  industry: "카페",
  tagline: "Aster Coffee — 편안하고 따뜻한",
  description: "신선한 커피를 지역 사회에 제공한다",
  mission: "신선한 커피를 지역 사회에 제공한다",
  vision: "동네에서 가장 신뢰받는 카페가 된다",
  coreValues: ["품질", "따뜻함", "지속가능성"],
  positioning: "카페 내에서 친근하고 따뜻한 이미지로 동네 직장인에게 다가가는 브랜드.",
  primaryAudience: "동네 직장인",
  secondaryAudience: "",
  customerProblems: "대형 프랜차이즈와 경쟁",
  desiredImpression: "편안하고 따뜻한",
  brandTone: "친근하고 따뜻한",
  brandPersonality: "친근하고 따뜻한",
  keywords: ["카페", "품질"],
  avoidKeywords: ["차가움", "획일적"],
  preferredStyle: "미니멀",
  preferredColor: "브랜드 톤에 맞는 중성 계열 컬러",
  preferredSymbol: "심플한 기하학적 심볼",
  typographyDirection: "가독성 높은 산세리프",
};

describe("buildBrandKnowledge", () => {
  it("maps Brand Brief fields onto Brand Knowledge", () => {
    const knowledge = buildBrandKnowledge(BRIEF);
    expect(knowledge.mission).toBe(BRIEF.mission);
    expect(knowledge.values).toEqual(BRIEF.coreValues);
    expect(knowledge.audience).toBe("동네 직장인");
    expect(knowledge.visualDirection).toContain("미니멀");
  });

  it("joins primary and secondary audience when both are present", () => {
    const knowledge = buildBrandKnowledge({ ...BRIEF, secondaryAudience: "주변 대학생" });
    expect(knowledge.audience).toBe("동네 직장인 / 주변 대학생");
  });
});

describe("buildStrategyProfile", () => {
  it("infers a brand archetype from tone/personality keywords", () => {
    const knowledge = buildBrandKnowledge(BRIEF);
    const profile = buildStrategyProfile(BRIEF, knowledge.visualDirection);
    expect(profile.brandArchetype).toBe("동반자 (The Everyman)");
  });

  it("provides a reason for every recommendation", () => {
    const knowledge = buildBrandKnowledge(BRIEF);
    const profile = buildStrategyProfile(BRIEF, knowledge.visualDirection);
    expect(profile.recommendedStyles.at(0)?.reason).toBeTruthy();
    expect(profile.recommendedColors.at(0)?.reason).toBeTruthy();
    expect(profile.recommendedTypography.at(0)?.reason).toBeTruthy();
    expect(profile.recommendedSymbols.at(0)?.reason).toBeTruthy();
  });
});

describe("buildStyleCandidates", () => {
  it("maps a preferred style keyword onto the Level-1 taxonomy", () => {
    const candidates = buildStyleCandidates(BRIEF);
    expect(candidates.at(0)?.name).toBe("Minimal");
    expect(candidates).toHaveLength(2);
    expect(candidates.at(0)?.reason).toBeTruthy();
  });

  it("falls back to Modern when no keyword matches", () => {
    const candidates = buildStyleCandidates({ ...BRIEF, preferredStyle: "알수없음" });
    expect(candidates.at(0)?.name).toBe("Modern");
  });
});

describe("calculateConfidence", () => {
  it("returns low confidence when no optional signals are present", () => {
    const result = calculateConfidence({
      briefSource: "ai",
      secondaryAudience: "",
    });
    expect(result.level).toBe("low");
    expect(result.notes).toContain("경쟁 환경 정보");
  });

  it("returns high confidence when all optional signals are present", () => {
    const result = calculateConfidence({
      competitiveContext: "대형 프랜차이즈와 경쟁",
      avoidKeywords: "차가움",
      briefSource: "user",
      secondaryAudience: "주변 대학생",
    });
    expect(result.level).toBe("high");
    expect(result.notes).toBe("충분한 정보를 바탕으로 분석했습니다.");
  });

  it("returns medium confidence for a partial signal set", () => {
    const result = calculateConfidence({
      competitiveContext: "대형 프랜차이즈와 경쟁",
      briefSource: "ai",
      secondaryAudience: "",
    });
    expect(result.level).toBe("medium");
  });
});
