import { getColorNameHints } from "@/modules/colorPalettes/domain/interviewColorSuggestion";
import type { HardConstraintSet } from "@/modules/promptPriority/domain/HardConstraint";

export interface PromptComplianceResult {
  passed: boolean;
  issues: string[];
}

/**
 * 조립된 프롬프트 "텍스트"가 하드제약을 실제로 담고 있는지 확인하는 무료
 * 검증 -- 이미지 자체는 검증하지 않는다(비용 발생하는 Vision 분석 없음).
 * 프롬프트 텍스트에 금지 색상/요소가 실제로 언급됐는지만 확인한다(대소문자
 * 무시 substring). 필수 조건은 buildPromptLayers가 항상 삽입하므로 여기선
 * "금지된 게 안 들어갔는지"만 확인하면 충분하다.
 */
export function checkPromptCompliance(composedUserPrompt: string, hc: HardConstraintSet): PromptComplianceResult {
  const issues: string[] = [];
  const text = composedUserPrompt.toLowerCase();

  for (const forbiddenColor of hc.forbiddenColors) {
    const hints = [forbiddenColor.toLowerCase(), ...getColorNameHints(forbiddenColor).map((h) => h.toLowerCase())];
    if (hints.some((hint) => text.includes(hint))) {
      issues.push(`forbidden color '${forbiddenColor}' hex/label found in composed prompt text`);
    }
  }

  for (const forbiddenElement of hc.forbiddenElements) {
    if (text.includes(forbiddenElement.toLowerCase())) {
      issues.push(`forbidden element '${forbiddenElement}' found in composed prompt text`);
    }
  }

  for (const forbiddenStyle of hc.forbiddenStyleNames) {
    if (text.includes(forbiddenStyle.toLowerCase())) {
      issues.push(`forbidden style '${forbiddenStyle}' found in composed prompt text`);
    }
  }

  return { passed: issues.length === 0, issues };
}
