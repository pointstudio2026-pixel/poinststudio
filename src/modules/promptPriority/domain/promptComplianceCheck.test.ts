import { describe, expect, it } from "vitest";
import { checkPromptCompliance } from "@/modules/promptPriority/domain/promptComplianceCheck";
import type { HardConstraintSet } from "@/modules/promptPriority/domain/HardConstraint";

const EMPTY: HardConstraintSet = {
  exactBrandName: "",
  forbiddenColors: [],
  requiredColors: [],
  forbiddenStyleNames: [],
  forbiddenLogoCategoryNames: [],
  forbiddenElements: [],
  requiredElements: [],
  purpose: [],
  freeTextConstraints: "",
};

describe("checkPromptCompliance", () => {
  it("passes when there are no hard constraints at all", () => {
    const result = checkPromptCompliance("차가운 블루 톤의 미니멀 로고를 생성한다.", EMPTY);
    expect(result.passed).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("passes when the forbidden color/hex genuinely doesn't appear in the text", () => {
    const hc: HardConstraintSet = { ...EMPTY, forbiddenColors: ["#a16207"] };
    const result = checkPromptCompliance("차가운 블루 톤의 미니멀 로고를 생성한다.", hc);
    expect(result.passed).toBe(true);
  });

  it("fails and lists an issue when a forbidden color's hex appears in the composed text", () => {
    const hc: HardConstraintSet = { ...EMPTY, forbiddenColors: ["#a16207"] };
    const result = checkPromptCompliance("브랜드 컬러: Gold(#a16207)를 사용한다.", hc);
    expect(result.passed).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("fails when a forbidden element appears in the composed text", () => {
    const hc: HardConstraintSet = { ...EMPTY, forbiddenElements: ["종교적 상징"] };
    const result = checkPromptCompliance("종교적 상징을 활용한 로고를 생성한다.", hc);
    expect(result.passed).toBe(false);
  });
});
