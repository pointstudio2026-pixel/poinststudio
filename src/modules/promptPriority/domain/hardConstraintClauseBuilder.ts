import type { HardConstraintSet } from "@/modules/promptPriority/domain/HardConstraint";

function hasAnyConstraint(hc: HardConstraintSet): boolean {
  return (
    hc.forbiddenColors.length > 0 ||
    hc.forbiddenStyleNames.length > 0 ||
    hc.forbiddenLogoCategoryNames.length > 0 ||
    hc.forbiddenElements.length > 0 ||
    hc.freeTextConstraints.length > 0
  );
}

/**
 * 프롬프트 맨 앞에 붙는 절대 준수 조항. 하드제약이 하나도 없으면 빈
 * 문자열을 반환한다 -- 이게 기존 프로젝트(전부 하드제약 없음)의 프롬프트
 * 출력을 전혀 바꾸지 않는 핵심 보장이다. colorContext의 기존 배타적
 * 어투("이 팔레트 안의 색상만 사용한다")를 그대로 잇는다.
 */
export function buildHardConstraintOpeningClause(hc: HardConstraintSet): string {
  if (!hasAnyConstraint(hc)) return "";

  const lines: string[] = [
    "다음은 사용자가 직접 지정한 절대 준수 조건이다 -- 아래 어떤 업종 관습이나 " +
      "일반적인 디자인 추천보다도 우선한다.",
  ];

  if (hc.forbiddenColors.length > 0) {
    lines.push(`금지 색상(절대 사용 금지): ${hc.forbiddenColors.join(", ")}`);
  }
  if (hc.forbiddenStyleNames.length > 0) {
    lines.push(`금지 스타일(절대 사용 금지): ${hc.forbiddenStyleNames.join(", ")}`);
  }
  if (hc.forbiddenLogoCategoryNames.length > 0) {
    lines.push(`금지 로고 구조(절대 사용 금지): ${hc.forbiddenLogoCategoryNames.join(", ")}`);
  }
  if (hc.forbiddenElements.length > 0) {
    lines.push(`금지 요소(절대 포함 금지): ${hc.forbiddenElements.join(", ")}`);
  }
  if (hc.freeTextConstraints) {
    lines.push(`사용자 지정 필수 조건: ${hc.freeTextConstraints}`);
  }

  return lines.join("\n");
}

/**
 * 프롬프트 맨 뒤에 다시 한 번 강조하는 조항(같은 내용을 앞뒤에서 두 번
 * 명시해야 실제로 더 잘 지켜진다는 게 이 프롬프트 파이프라인의 기존
 * 관행 -- colorContext/additionalRequirementsContext가 이미 그렇게
 * 뒤쪽에 배치돼있다). 하드제약이 없으면 빈 문자열.
 */
export function buildHardConstraintClosingClause(hc: HardConstraintSet): string {
  if (!hasAnyConstraint(hc)) return "";

  const banned = [...hc.forbiddenColors, ...hc.forbiddenStyleNames, ...hc.forbiddenLogoCategoryNames, ...hc.forbiddenElements];

  const lines: string[] = ["최종 확인: 아래 조건을 다시 한번 반드시 지킨다."];
  if (banned.length > 0) {
    lines.push(`다음은 이미지 어디에도 포함하지 않는다: ${banned.join(", ")}`);
  }
  if (hc.freeTextConstraints) {
    lines.push(`사용자 지정 필수 조건을 다시 확인한다: ${hc.freeTextConstraints}`);
  }

  return lines.join("\n");
}
