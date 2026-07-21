import type { SizePreset } from "@/shared/ai/ImageGenerationProvider";
import { BRANDING_LOGO_DELIVERABLE_TYPE } from "@/modules/projects/domain/deliverableTypes";

const ORIENTATION_ANSWER_KEY = "deliverableOrientation";

/**
 * 유형상 방향이 사실상 고정인 것들은 질문 없이 자동 결정한다. 리플렛은
 * 삼단 접지 6패널을 펼친 형태로 항상 가로로 길게 나와야 하므로(promptBuilder.ts
 * 참고) 세로/정사각 선택지가 애초에 말이 안 돼 고정으로 옮겼다.
 */
const FIXED_ORIENTATION_BY_TYPE: Record<string, SizePreset> = {
  명함: "landscape",
  리플렛: "landscape",
  "앱 디자인": "portrait",
  웹사이트: "landscape",
};

/** deliverableTypeQuestions.ts의 DELIVERABLE_ORIENTATION_QUESTION 옵션 문구와 정확히 일치해야 한다. */
export const ORIENTATION_OPTION_TO_PRESET: Record<string, SizePreset> = {
  "세로형 (A4·B4 등 세로 포스터/문서)": "portrait",
  "가로형 (와이드 배너/가로형)": "landscape",
  "정사각형 (SNS 정사각 등)": "square",
};

/**
 * 작업물 유형 + 인터뷰 답변으로부터 실제 이미지 생성 요청에 쓸 크기 프리셋을
 * 결정론적으로 계산한다. 로고/명함/앱 디자인/웹사이트는 유형상 방향이 자명해
 * 질문하지 않고 고정값을 쓰고, 포스터/리플렛/브로슈어/패키지는
 * `deliverableOrientation` 답변(DELIVERABLE_ORIENTATION_QUESTION)을 그대로
 * 매핑한다.
 */
export function resolveSizePreset(
  deliverableType: string | null | undefined,
  answers: Record<string, string>,
): SizePreset {
  if (!deliverableType || deliverableType === BRANDING_LOGO_DELIVERABLE_TYPE) {
    return "square";
  }
  const fixed = FIXED_ORIENTATION_BY_TYPE[deliverableType];
  if (fixed) return fixed;

  const answer = answers[ORIENTATION_ANSWER_KEY];
  return (answer && ORIENTATION_OPTION_TO_PRESET[answer]) || "portrait";
}
