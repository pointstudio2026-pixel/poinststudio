import { describe, expect, it } from "vitest";
import { resolveSizePreset } from "@/modules/prompts/domain/sizePresetRules";
import { BRANDING_LOGO_DELIVERABLE_TYPE } from "@/modules/projects/domain/deliverableTypes";

describe("resolveSizePreset", () => {
  it("returns square for branding & logo (and legacy null)", () => {
    expect(resolveSizePreset(BRANDING_LOGO_DELIVERABLE_TYPE, {})).toBe("square");
    expect(resolveSizePreset(null, {})).toBe("square");
    expect(resolveSizePreset(undefined, {})).toBe("square");
  });

  it("returns fixed orientations for types where it's structurally obvious", () => {
    expect(resolveSizePreset("명함", {})).toBe("landscape");
    expect(resolveSizePreset("앱 디자인", {})).toBe("portrait");
    expect(resolveSizePreset("웹사이트", {})).toBe("landscape");
  });

  // 리플렛은 삼단 접지 6패널을 펼친 가로 스트립으로 항상 생성하므로(promptBuilder.ts)
  // 방향 질문 자체가 없다 -- 다른 고정 유형들과 동일하게 항상 landscape다.
  it("always returns landscape for 리플렛, ignoring any stray orientation answer", () => {
    expect(resolveSizePreset("리플렛", {})).toBe("landscape");
    expect(
      resolveSizePreset("리플렛", { deliverableOrientation: "세로형 (A4·B4 등 세로 포스터/문서)" }),
    ).toBe("landscape");
  });

  it("maps the deliverableOrientation answer for ambiguous types (포스터 등)", () => {
    expect(
      resolveSizePreset("포스터", { deliverableOrientation: "세로형 (A4·B4 등 세로 포스터/문서)" }),
    ).toBe("portrait");
    expect(
      resolveSizePreset("브로슈어", { deliverableOrientation: "정사각형 (SNS 정사각 등)" }),
    ).toBe("square");
  });

  it("defaults to portrait for ambiguous types when unanswered", () => {
    expect(resolveSizePreset("패키지", {})).toBe("portrait");
  });
});
