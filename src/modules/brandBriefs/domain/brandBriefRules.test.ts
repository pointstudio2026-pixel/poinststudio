import { describe, expect, it } from "vitest";
import { buildFallbackEnhancedFields, buildRuleBasedFields } from "@/modules/brandBriefs/domain/brandBriefRules";

describe("buildRuleBasedFields", () => {
  it("maps interview answers directly onto Brand Brief fields", () => {
    const answers = {
      brandName: "Aster Coffee",
      industry: "카페",
      purpose: "신선한 커피를 지역 사회에 제공한다",
      coreValues: "품질, 따뜻함, 지속가능성",
      targetAudience: "동네 직장인",
      competitiveContext: "대형 프랜차이즈와 경쟁",
      desiredImpression: "편안하고 따뜻한",
      avoidKeywords: "차가움, 획일적",
    };

    const fields = buildRuleBasedFields(answers);

    expect(fields.brandName).toBe("Aster Coffee");
    expect(fields.industry).toBe("카페");
    expect(fields.mission).toBe(answers.purpose);
    expect(fields.coreValues).toEqual(["품질", "따뜻함", "지속가능성"]);
    expect(fields.primaryAudience).toBe("동네 직장인");
    expect(fields.avoidKeywords).toEqual(["차가움", "획일적"]);
  });

  it("defaults missing/optional answers to empty values", () => {
    const fields = buildRuleBasedFields({ brandName: "X" });
    expect(fields.coreValues).toEqual([]);
    expect(fields.customerProblems).toBe("");
    expect(fields.avoidKeywords).toEqual([]);
  });
});

describe("buildFallbackEnhancedFields", () => {
  it("infers a warm tone from a cozy desired impression", () => {
    const base = buildRuleBasedFields({
      brandName: "Aster Coffee",
      desiredImpression: "편안하고 따뜻한 느낌",
    });
    const enhanced = buildFallbackEnhancedFields({}, base);
    expect(enhanced.brandTone).toBe("친근하고 따뜻한");
  });

  it("infers a professional tone from a trust-oriented desired impression", () => {
    const base = buildRuleBasedFields({ desiredImpression: "신뢰할 수 있는 전문적인 느낌" });
    const enhanced = buildFallbackEnhancedFields({}, base);
    expect(enhanced.brandTone).toBe("전문적이고 신뢰감 있는");
  });

  it("always produces non-empty visual direction fields", () => {
    const base = buildRuleBasedFields({});
    const enhanced = buildFallbackEnhancedFields({}, base);
    expect(enhanced.preferredStyle).toBeTruthy();
    expect(enhanced.preferredColor).toBeTruthy();
    expect(enhanced.preferredSymbol).toBeTruthy();
    expect(enhanced.typographyDirection).toBeTruthy();
  });
});
