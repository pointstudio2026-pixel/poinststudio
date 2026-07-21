import { describe, expect, it } from "vitest";
import { BRANDING_WORKSPACE_STEPS, NON_BRANDING_WORKSPACE_STEPS, getWorkspaceSteps } from "@/modules/projects/domain/Project";

describe("getWorkspaceSteps", () => {
  it("returns the full 8-step branding list for 브랜딩 & 로고", () => {
    const steps = getWorkspaceSteps("브랜딩 & 로고");
    expect(steps).toBe(BRANDING_WORKSPACE_STEPS);
    expect(steps.map((s) => s.key)).toEqual([
      "deliverable_type",
      "brand_interview",
      "style",
      "brand_strategy",
      "logo_style",
      "generation",
      "concept_board",
      "mockup",
    ]);
  });

  it("returns the shorter 6-step list for any other deliverable type, skipping brand_strategy/logo_style", () => {
    const steps = getWorkspaceSteps("포스터");
    expect(steps).toBe(NON_BRANDING_WORKSPACE_STEPS);
    expect(steps.map((s) => s.key)).toEqual([
      "deliverable_type",
      "brand_interview",
      "style",
      "generation",
      "concept_board",
      "mockup",
    ]);
  });

  it("treats null/undefined (legacy projects) the same as 브랜딩 & 로고 for backward compatibility", () => {
    expect(getWorkspaceSteps(null)).toBe(BRANDING_WORKSPACE_STEPS);
    expect(getWorkspaceSteps(undefined)).toBe(BRANDING_WORKSPACE_STEPS);
  });
});
