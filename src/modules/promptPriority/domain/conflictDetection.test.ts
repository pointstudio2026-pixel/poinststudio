import { describe, expect, it } from "vitest";
import { detectDbConflicts, detectInternalOverlap, type DbSuggestion } from "@/modules/promptPriority/domain/conflictDetection";
import type { HardConstraintSet } from "@/modules/promptPriority/domain/HardConstraint";

function baseHardConstraints(overrides: Partial<HardConstraintSet> = {}): HardConstraintSet {
  return {
    exactBrandName: "",
    forbiddenColors: [],
    requiredColors: [],
    forbiddenStyleNames: [],
    forbiddenLogoCategoryNames: [],
    forbiddenElements: [],
    requiredElements: [],
    purpose: [],
    freeTextConstraints: "",
    ...overrides,
  };
}

const preserveGoal = (reason: string) => `preserved: ${reason}`;

describe("detectDbConflicts", () => {
  it("returns no conflicts when nothing is forbidden", () => {
    const suggestions: DbSuggestion[] = [
      { field: "color", category: "COLOR_CONFLICT", sourceRef: "ex-1", text: "골드 톤의 프리미엄 로고", reason: "프리미엄" },
    ];
    const conflicts = detectDbConflicts(baseHardConstraints(), suggestions, preserveGoal);
    expect(conflicts).toEqual([]);
  });

  it("detects a color conflict when a DB suggestion mentions a forbidden hex or its known Korean color name", () => {
    const hc = baseHardConstraints({ forbiddenColors: ["#a16207"] }); // 골드 hex, per interviewColorSuggestion.ts's table
    const suggestions: DbSuggestion[] = [
      { field: "color", category: "COLOR_CONFLICT", sourceRef: "ex-1", text: "골드 톤의 프리미엄 로고", reason: "프리미엄한 느낌" },
    ];
    const conflicts = detectDbConflicts(hc, suggestions, preserveGoal);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      category: "COLOR_CONFLICT",
      resolution: "KEEP_USER_DISCARD_SUGGESTION",
      sourceRef: "ex-1",
      preservedGoalVia: "preserved: 프리미엄한 느낌",
    });
  });

  it("detects a style conflict when a DB suggestion's text mentions a forbidden style name", () => {
    const hc = baseHardConstraints({ forbiddenStyleNames: ["빈티지"] });
    const suggestions: DbSuggestion[] = [
      { field: "style", category: "STYLE_CONFLICT", sourceRef: "ex-2", text: "빈티지 감성의 로고", reason: "빈티지" },
    ];
    const conflicts = detectDbConflicts(hc, suggestions, preserveGoal);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.category).toBe("STYLE_CONFLICT");
  });

  it("does not flag a candidate whose text has nothing to do with the forbidden values", () => {
    const hc = baseHardConstraints({ forbiddenColors: ["#a16207"] });
    const suggestions: DbSuggestion[] = [
      { field: "color", category: "COLOR_CONFLICT", sourceRef: "ex-3", text: "차가운 블루 톤의 미니멀 로고", reason: "신뢰" },
    ];
    expect(detectDbConflicts(hc, suggestions, preserveGoal)).toEqual([]);
  });
});

describe("detectInternalOverlap", () => {
  it("returns no conflicts for disjoint required/forbidden sets", () => {
    const hc = baseHardConstraints({
      requiredColors: [{ hex: "#2563eb", label: "Blue" }],
      forbiddenColors: ["#a16207"],
    });
    expect(detectInternalOverlap(hc)).toEqual([]);
  });

  it("detects when the same color hex is in both required and forbidden lists", () => {
    const hc = baseHardConstraints({
      requiredColors: [{ hex: "#a16207", label: "Gold" }],
      forbiddenColors: ["#a16207"],
    });
    const conflicts = detectInternalOverlap(hc);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.category).toBe("COLOR_CONFLICT");
  });

  it("detects when the same element is in both required and forbidden lists", () => {
    const hc = baseHardConstraints({
      requiredElements: ["로고"],
      forbiddenElements: ["로고"],
    });
    const conflicts = detectInternalOverlap(hc);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.category).toBe("INTERNAL_USER_CONFLICT");
  });
});
