import { describe, expect, it } from "vitest";
import { preserveGoal } from "@/modules/promptPriority/domain/goalPreservationRules";

describe("preserveGoal", () => {
  it("maps a known goal keyword to its deterministic fallback", () => {
    expect(preserveGoal("프리미엄한 느낌을 위해")).toBe(
      "넉넉한 여백과 절제된 타이포그래피 위계로 고급스러움을 표현한다.",
    );
  });

  it("maps '신뢰' to a structure-based fallback", () => {
    expect(preserveGoal("금융 업종은 신뢰감이 중요")).toContain("신뢰감을 표현한다");
  });

  it("never returns an empty string, even for an unrecognized reason", () => {
    const result = preserveGoal("완전히 알 수 없는 이유 텍스트");
    expect(result.length).toBeGreaterThan(0);
  });

  it("falls back to the generic clause for unrecognized reasons", () => {
    expect(preserveGoal("xyz")).toBe("이 방향의 목적은 색상 대신 구성·타이포그래피로 표현한다.");
  });
});
