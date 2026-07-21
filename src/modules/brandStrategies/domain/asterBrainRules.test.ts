import { describe, expect, it } from "vitest";
import { buildBrandKnowledgeFields } from "@/modules/brandStrategies/domain/brandKnowledgeRules";
import {
  buildBrandKnowledge,
  buildFallbackBrandStrategyData,
  buildFallbackStrategyProfiles,
  calculateConfidence,
} from "@/modules/brandStrategies/domain/asterBrainRules";

const ANSWERS: Record<string, string> = {
  brandName: "Aster Coffee",
  industry: "카페",
  purpose: "신선한 커피를 지역 사회에 제공한다",
  targetAudience: "동네 직장인",
  desiredImpression: "편안하고 따뜻한 느낌",
};

describe("buildBrandKnowledge", () => {
  it("maps interview answers onto Brand Knowledge", () => {
    const knowledge = buildBrandKnowledge(ANSWERS);
    expect(knowledge.mission).toBe(ANSWERS.purpose);
    expect(knowledge.audience).toBe("동네 직장인");
    expect(knowledge.visualDirection).toContain("미니멀");
  });

  it("falls back to generic placeholders when tone-related answers are absent", () => {
    const answersWithoutImpression: Record<string, string> = {
      brandName: ANSWERS.brandName!,
      industry: ANSWERS.industry!,
      purpose: ANSWERS.purpose!,
      targetAudience: ANSWERS.targetAudience!,
    };
    const knowledge = buildBrandKnowledgeFields(answersWithoutImpression);
    expect(knowledge.tone).toBe("균형 잡히고 진정성 있는");
  });

  it("infers tone from the desiredImpression answer (인터뷰 질문으로 되살아난 inferTone)", () => {
    const knowledge = buildBrandKnowledgeFields(ANSWERS);
    expect(knowledge.tone).toBe("친근하고 따뜻한");
  });
});

describe("buildFallbackStrategyProfiles", () => {
  it("returns 3 distinct archetype directions", () => {
    const knowledge = buildBrandKnowledgeFields(ANSWERS);
    const profiles = buildFallbackStrategyProfiles(ANSWERS, knowledge);
    expect(profiles).toHaveLength(3);
    const archetypes = new Set(profiles.map((p) => p.brandArchetype));
    expect(archetypes.size).toBe(3);
  });

  it("provides a reason for every recommendation", () => {
    const knowledge = buildBrandKnowledgeFields(ANSWERS);
    const [profile] = buildFallbackStrategyProfiles(ANSWERS, knowledge);
    expect(profile!.recommendedStyles.at(0)?.reason).toBeTruthy();
    expect(profile!.recommendedColors.at(0)?.reason).toBeTruthy();
    expect(profile!.recommendedTypography.at(0)?.reason).toBeTruthy();
    expect(profile!.recommendedSymbols.at(0)?.reason).toBeTruthy();
  });
});

describe("buildFallbackBrandStrategyData", () => {
  it("assembles a full BrandStrategyData purely from interview answers, no AI/persistence involved", () => {
    const data = buildFallbackBrandStrategyData(ANSWERS);

    expect(data.brandKnowledge.mission).toBe(ANSWERS.purpose);
    expect(data.brandStrategy.brandArchetype).toBeTruthy();
    expect(data.brandStrategy.toneAndManner).toBeTruthy();
    expect(data.confidenceScore).toBeGreaterThan(0);
  });

  it("is deterministic -- identical answers always produce identical output", () => {
    const first = buildFallbackBrandStrategyData(ANSWERS);
    const second = buildFallbackBrandStrategyData(ANSWERS);
    expect(first).toEqual(second);
  });

  it("uses the same brandKnowledge fields buildBrandKnowledge would produce for the same answers", () => {
    const data = buildFallbackBrandStrategyData(ANSWERS);
    const knowledge = buildBrandKnowledge(ANSWERS);
    expect(data.brandKnowledge.audience).toBe(knowledge.audience);
    expect(data.brandKnowledge.tagline).toBe(knowledge.tagline);
  });
});

describe("calculateConfidence", () => {
  it("returns medium confidence with only the 5 required answers", () => {
    const result = calculateConfidence(ANSWERS);
    expect(result.level).toBe("medium");
    expect(result.notes).toContain("추가 질문");
  });

  it("returns higher confidence as more optional answers are present", () => {
    const result = calculateConfidence({
      ...ANSWERS,
      coreValues: "품질, 따뜻함",
      competitiveContext: "대형 프랜차이즈와 경쟁",
    });
    expect(result.score).toBeGreaterThan(0.5);
    expect(result.notes).toBe("충분한 정보를 바탕으로 분석했습니다.");
  });

  // Plan 리뷰에서 발견: desiredImpression은 인터뷰의 필수 질문(항상 답변됨)
  // 이라 REQUIRED_ANSWER_KEYS에 없으면 모든 프로젝트의 기본 confidence가
  // 부풀려진다 -- optional 가산점 대상에서 제외됐는지 명시적으로 고정한다.
  it("does not count desiredImpression as an optional richness signal (필수 질문은 가산점 대상 아님)", () => {
    const withoutImpression = calculateConfidence({
      brandName: ANSWERS.brandName!,
      industry: ANSWERS.industry!,
      purpose: ANSWERS.purpose!,
      targetAudience: ANSWERS.targetAudience!,
    });
    const withImpression = calculateConfidence(ANSWERS);
    expect(withImpression.score).toBe(withoutImpression.score);
  });
});
