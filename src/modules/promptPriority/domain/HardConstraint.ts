export type ConflictCategory =
  | "COLOR_CONFLICT"
  | "STYLE_CONFLICT"
  | "LOGO_TYPE_CONFLICT"
  | "TYPOGRAPHY_CONFLICT"
  | "SHAPE_CONFLICT"
  | "MOOD_CONFLICT"
  | "TARGET_CONFLICT"
  | "USABILITY_CONFLICT"
  | "COPYRIGHT_CONFLICT"
  | "TRADEMARK_CONFLICT"
  | "TEXT_RENDERING_CONFLICT"
  | "INTERNAL_USER_CONFLICT";

/**
 * 사용자가 명시적으로 못 박은 조건 -- 어떤 DB 추천/전문가 규칙도 이걸
 * 덮어쓸 수 없다. `classifyInterviewInput()`이 인터뷰 답변 + (있으면)
 * 각 선택 데이터로부터 조립한다. 필드가 비어있으면(빈 배열/빈 문자열)
 * 해당 제약이 없다는 뜻 -- `hardConstraintClauseBuilder.ts`가 이걸
 * 감지해서 빈 문자열을 반환하고, 그 결과 기존 프로젝트의 프롬프트 출력은
 * 전혀 바뀌지 않는다.
 */
export interface HardConstraintSet {
  /** answers.brandName -- 항상 리터럴 고정값으로 취급(토글 불가). */
  exactBrandName: string;
  /** ColorPaletteSelection.forbiddenColors (hex). */
  forbiddenColors: string[];
  /** ColorPaletteSelection.swatches -- 이미 있던 필드, 재분류만. */
  requiredColors: { hex: string; label: string }[];
  /** StyleSelection.forbiddenStyleIds를 Style.name으로 해석한 값. */
  forbiddenStyleNames: string[];
  /** LogoStyleSelection.forbiddenCategoryIds를 LogoStyleCategory.name으로 해석한 값. */
  forbiddenLogoCategoryNames: string[];
  /** 인터뷰 forbiddenElements(전체 공통) + 작업물 유형별 deliverableAvoidElements. */
  forbiddenElements: string[];
  /** 작업물 유형별 <type>RequiredElements. */
  requiredElements: string[];
  /** answers.purpose -- 정보 제공용(이미 존재하고 이미 강제됨). */
  purpose: string[];
  /** answers.additionalNotes -- 절대 하위 필드로 파싱하지 않는다(오탐 위험). */
  freeTextConstraints: string;
}

export interface SoftPreferenceSet {
  /** answers.desiredImpression 등 무드 관련 답변. */
  moodWords: string[];
}
