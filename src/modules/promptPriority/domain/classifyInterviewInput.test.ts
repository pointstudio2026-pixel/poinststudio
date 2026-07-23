import { describe, expect, it } from "vitest";
import { classifyInterviewInput } from "@/modules/promptPriority/domain/classifyInterviewInput";

describe("classifyInterviewInput", () => {
  it("returns all-empty hard constraints when no answers are given", () => {
    const { hardConstraints } = classifyInterviewInput({ answers: {} });
    expect(hardConstraints.exactBrandName).toBe("");
    expect(hardConstraints.forbiddenColors).toEqual([]);
    expect(hardConstraints.requiredColors).toEqual([]);
    expect(hardConstraints.forbiddenStyleNames).toEqual([]);
    expect(hardConstraints.forbiddenLogoCategoryNames).toEqual([]);
    expect(hardConstraints.forbiddenElements).toEqual([]);
    expect(hardConstraints.requiredElements).toEqual([]);
    expect(hardConstraints.freeTextConstraints).toBe("");
  });

  it("splits multi-select forbiddenElements answers on ', ' (matches InterviewView.tsx's join separator)", () => {
    const { hardConstraints } = classifyInterviewInput({
      answers: { forbiddenElements: "특정 동물/인물 이미지, 종교적 상징" },
    });
    expect(hardConstraints.forbiddenElements).toEqual(["특정 동물/인물 이미지", "종교적 상징"]);
  });

  it("merges the universal forbiddenElements answer with the deliverable-type-specific avoid-elements answer", () => {
    const { hardConstraints } = classifyInterviewInput({
      answers: {
        forbiddenElements: "종교적 상징",
        deliverableAvoidElements: "가격/금액 표시, 복잡한 배경",
      },
      deliverableType: "포스터",
    });
    expect(hardConstraints.forbiddenElements).toEqual(["종교적 상징", "가격/금액 표시", "복잡한 배경"]);
  });

  it("reads required elements from the deliverable-type-specific key", () => {
    const { hardConstraints } = classifyInterviewInput({
      answers: { posterRequiredElements: "행사명/타이틀, 날짜" },
      deliverableType: "포스터",
    });
    expect(hardConstraints.requiredElements).toEqual(["행사명/타이틀", "날짜"]);
  });

  it("never splits additionalNotes into sub-fields -- keeps it as one opaque string", () => {
    const { hardConstraints } = classifyInterviewInput({
      answers: { additionalNotes: "반드시 빨간색을 써주세요, 그리고 동물은 절대 넣지 마세요" },
    });
    expect(hardConstraints.freeTextConstraints).toBe(
      "반드시 빨간색을 써주세요, 그리고 동물은 절대 넣지 마세요",
    );
  });

  it("classifies forbiddenColors/forbiddenStyleNames/forbiddenLogoCategoryNames passed in from already-loaded selections", () => {
    const { hardConstraints } = classifyInterviewInput({
      answers: {},
      forbiddenColors: ["#FFD700"],
      forbiddenStyleNames: ["빈티지"],
      forbiddenLogoCategoryNames: ["일러스트 중심"],
    });
    expect(hardConstraints.forbiddenColors).toEqual(["#FFD700"]);
    expect(hardConstraints.forbiddenStyleNames).toEqual(["빈티지"]);
    expect(hardConstraints.forbiddenLogoCategoryNames).toEqual(["일러스트 중심"]);
  });

  it("classifies desiredImpression into soft preferences, not hard constraints", () => {
    const { hardConstraints, softPreferences } = classifyInterviewInput({
      answers: { desiredImpression: "고급스럽고 세련된 느낌" },
    });
    expect(softPreferences.moodWords).toEqual(["고급스럽고 세련된 느낌"]);
    expect(hardConstraints.freeTextConstraints).toBe("");
  });
});
