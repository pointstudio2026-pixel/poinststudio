import { describe, expect, it } from "vitest";
import {
  buildHardConstraintClosingClause,
  buildHardConstraintOpeningClause,
} from "@/modules/promptPriority/domain/hardConstraintClauseBuilder";
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

describe("hardConstraintClauseBuilder", () => {
  // 이게 이번 기능 전체에서 가장 중요한 회귀 방지 테스트다 -- 하드제약이
  // 하나도 없는(오늘 존재하는 모든 프로젝트) 경우 두 절이 정확히 빈
  // 문자열이어야, composePrompt의 출력이 기존 프로젝트에서 한 글자도
  // 안 바뀐다는 게 보장된다.
  it("returns empty strings for both clauses when the constraint set is entirely empty", () => {
    expect(buildHardConstraintOpeningClause(EMPTY)).toBe("");
    expect(buildHardConstraintClosingClause(EMPTY)).toBe("");
  });

  it("includes forbidden colors in the opening clause when present", () => {
    const hc: HardConstraintSet = { ...EMPTY, forbiddenColors: ["#FFD700"] };
    const opening = buildHardConstraintOpeningClause(hc);
    expect(opening).not.toBe("");
    expect(opening).toContain("#FFD700");
  });

  it("restates forbidden values in the closing clause", () => {
    const hc: HardConstraintSet = { ...EMPTY, forbiddenColors: ["#FFD700"], forbiddenElements: ["종교적 상징"] };
    const closing = buildHardConstraintClosingClause(hc);
    expect(closing).toContain("#FFD700");
    expect(closing).toContain("종교적 상징");
  });

  it("includes freeTextConstraints verbatim without splitting it", () => {
    const hc: HardConstraintSet = { ...EMPTY, freeTextConstraints: "반드시 이 문구를 포함해주세요" };
    expect(buildHardConstraintOpeningClause(hc)).toContain("반드시 이 문구를 포함해주세요");
  });

  // 회귀 방지: exactBrandName이 hasAnyConstraint()에서 빠져있어서 opening/
  // closing 절 어디에도 안 나오던 실제 버그(2026-07-27, AI가 사용자가 입력한
  // 브랜드명 대신 임의의 이름을 생성) -- 브랜드명만 있어도 절이 비지 않고,
  // 두 절 모두에 정확한 문자열 그대로 나와야 한다.
  it("includes exactBrandName verbatim in both the opening and closing clause", () => {
    const hc: HardConstraintSet = { ...EMPTY, exactBrandName: "WILLOW & OAT" };
    const opening = buildHardConstraintOpeningClause(hc);
    const closing = buildHardConstraintClosingClause(hc);
    expect(opening).not.toBe("");
    expect(opening).toContain("WILLOW & OAT");
    expect(closing).not.toBe("");
    expect(closing).toContain("WILLOW & OAT");
  });
});
