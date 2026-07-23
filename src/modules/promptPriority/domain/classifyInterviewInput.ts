import type { ColorSwatch } from "@/modules/colorPalettes/domain/ColorPalette";
import { DELIVERABLE_AVOID_ELEMENTS_KEY, getRequiredElementsKey } from "@/modules/interviews/domain/deliverableTypeQuestions";
import type { HardConstraintSet, SoftPreferenceSet } from "@/modules/promptPriority/domain/HardConstraint";

/** InterviewView.tsx가 다중 선택 답변을 저장할 때 쓰는 구분자와 정확히 일치해야 한다. */
function splitMultiSelectAnswer(answer: string | undefined): string[] {
  if (!answer) return [];
  return answer
    .split(", ")
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface ClassifyInterviewInputParams {
  /** interview.answers를 questionKey -> answer로 펼친 맵(BuildPromptUseCase/RecommendStylesUseCase가 이미 만드는 것과 동일). */
  answers: Record<string, string>;
  deliverableType?: string | null;
  /** 스타일 추천 단계처럼 아직 색상/스타일 선택이 없는 시점엔 생략 가능 -- 그 필드들은 빈 배열로 나온다. */
  colorPaletteSwatches?: ColorSwatch[];
  forbiddenColors?: string[];
  forbiddenStyleNames?: string[];
  forbiddenLogoCategoryNames?: string[];
}

/**
 * 인터뷰 답변 + (있으면) 각 선택 데이터를 하드제약/소프트선호로 분류하는
 * 순수 함수. AI 호출 없음. 인터뷰 답변만 있어도 호출 가능하게 설계했다 --
 * 스타일 추천 단계(RecommendStylesUseCase)는 아직 Style/Color 선택이
 * 없는 시점에서 이 함수를 쓴다.
 */
export function classifyInterviewInput(params: ClassifyInterviewInputParams): {
  hardConstraints: HardConstraintSet;
  softPreferences: SoftPreferenceSet;
} {
  const requiredElementsKey = getRequiredElementsKey(params.deliverableType);

  const forbiddenElements = [
    ...splitMultiSelectAnswer(params.answers.forbiddenElements),
    ...splitMultiSelectAnswer(params.answers[DELIVERABLE_AVOID_ELEMENTS_KEY]),
  ];
  const requiredElements = requiredElementsKey ? splitMultiSelectAnswer(params.answers[requiredElementsKey]) : [];

  const hardConstraints: HardConstraintSet = {
    exactBrandName: params.answers.brandName ?? "",
    forbiddenColors: params.forbiddenColors ?? [],
    requiredColors: (params.colorPaletteSwatches ?? []).map((s) => ({ hex: s.hex, label: s.label })),
    forbiddenStyleNames: params.forbiddenStyleNames ?? [],
    forbiddenLogoCategoryNames: params.forbiddenLogoCategoryNames ?? [],
    forbiddenElements,
    requiredElements,
    purpose: splitMultiSelectAnswer(params.answers.purpose),
    freeTextConstraints: params.answers.additionalNotes?.trim() ?? "",
  };

  const softPreferences: SoftPreferenceSet = {
    moodWords: splitMultiSelectAnswer(params.answers.desiredImpression),
  };

  return { hardConstraints, softPreferences };
}
