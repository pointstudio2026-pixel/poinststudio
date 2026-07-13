/**
 * 14_PRD_PromptEngine.md "Safety Rules" / "Prompt Layers" Layer 5, applied
 * as the last step before a prompt is versioned (per that PRD's Claude
 * Code Instructions: "Safety Layer는 항상 마지막 단계에서 적용한다"). Known
 * real brand/trademark references are generalized rather than blocked
 * outright, matching 13_PRD_AsterBrain.md's guardrail: "상표권 침해
 * 가능성이 있는 요청은 일반적인 방향성으로 전환한다."
 */
const BANNED_TERM_RULES: { pattern: RegExp; replacement: string }[] = [
  { pattern: /나이키|Nike/gi, replacement: "글로벌 스포츠 브랜드풍(직접 모방 아님)" },
  { pattern: /코카콜라|Coca-?Cola/gi, replacement: "클래식 음료 브랜드풍(직접 모방 아님)" },
  { pattern: /애플\s*로고|Apple\s*logo/gi, replacement: "미니멀 테크 심볼(직접 모방 아님)" },
  { pattern: /스타벅스|Starbucks/gi, replacement: "글로벌 카페 브랜드풍(직접 모방 아님)" },
  { pattern: /루이비통|샤넬|구찌|Louis Vuitton|Chanel|Gucci/gi, replacement: "럭셔리 브랜드풍(직접 모방 아님)" },
];

export const SAFETY_CONSTRAINTS_TEXT =
  "특정 실존 브랜드의 로고, 상표, 저작권 보호 디자인을 복제하거나 모방하지 않는다. " +
  "위험하거나 정책에 위반되는 요청은 안전한 일반적 방향으로 전환한다.";

export interface SafetyResult {
  text: string;
  flaggedTerms: string[];
}

export function applySafetyRules(text: string): SafetyResult {
  let result = text;
  const flaggedTerms: string[] = [];

  for (const rule of BANNED_TERM_RULES) {
    if (rule.pattern.test(result)) {
      flaggedTerms.push(rule.pattern.source);
      result = result.replace(rule.pattern, rule.replacement);
    }
    rule.pattern.lastIndex = 0;
  }

  return { text: result, flaggedTerms };
}
