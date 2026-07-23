import type { ColorSwatch } from "@/modules/colorPalettes/domain/ColorPalette";

/**
 * 인터뷰 서술형 답변(additionalNotes)에서 언급된 색상 단어를 찾아 스타일
 * 단계의 컬러 피커에 제안할 스와치로 변환한다. conceptBoardComposer.ts의
 * COLOR_KEYWORD_RULES(분위기 키워드)와 달리 여기는 실제 색상 명사를 직접
 * 매칭한다 -- 기존 코드베이스에 이런 사전이 없어 새로 만들었다.
 */
const COLOR_KEYWORD_RULES: { pattern: RegExp; hex: string }[] = [
  { pattern: /검정|블랙/g, hex: "#0a0a0a" },
  { pattern: /흰|화이트/g, hex: "#ffffff" },
  { pattern: /회색|그레이/g, hex: "#9ca3af" },
  { pattern: /빨강|레드/g, hex: "#dc2626" },
  { pattern: /주황|오렌지/g, hex: "#f97316" },
  { pattern: /노랑|옐로우/g, hex: "#facc15" },
  { pattern: /초록|그린/g, hex: "#16a34a" },
  { pattern: /파랑|블루/g, hex: "#2563eb" },
  { pattern: /남색|네이비/g, hex: "#1e3a8a" },
  { pattern: /보라|퍼플/g, hex: "#7c3aed" },
  { pattern: /분홍|핑크/g, hex: "#ec4899" },
  { pattern: /갈색|브라운/g, hex: "#78350f" },
  { pattern: /베이지/g, hex: "#d6b98c" },
  { pattern: /민트/g, hex: "#2dd4bf" },
  { pattern: /청록|틸/g, hex: "#0f766e" },
  { pattern: /금색|골드/g, hex: "#a16207" },
  // 회색과 다른 hex를 써야 한다 -- 같은 hex면 아래 dedupe 단계에서 하나로
  // 합쳐져 "회색이랑 은색 둘 다" 같은 문장에서 스와치가 하나로 줄어든다.
  { pattern: /은색|실버/g, hex: "#c0c0c0" },
  { pattern: /형광|네온/g, hex: "#ccff00" },
];

const ROLE_KEYWORD_RULES: { pattern: RegExp; label: string }[] = [
  { pattern: /배경/, label: "배경" },
  { pattern: /글씨|텍스트|폰트|글자/, label: "글씨" },
  { pattern: /포인트|강조|악센트/, label: "포인트" },
];

const ROLE_SEARCH_WINDOW = 15;
const MAX_SUGGESTED_SWATCHES = 3;
const MIN_SUGGESTED_SWATCHES = 2;

interface RawColorMatch {
  index: number;
  length: number;
  hex: string;
}

function findNearbyRoleLabel(text: string, match: RawColorMatch, usedLabels: Set<string>): string | null {
  const windowStart = Math.max(0, match.index - ROLE_SEARCH_WINDOW);
  const windowEnd = Math.min(text.length, match.index + match.length + ROLE_SEARCH_WINDOW);
  const windowText = text.slice(windowStart, windowEnd);

  for (const rule of ROLE_KEYWORD_RULES) {
    if (usedLabels.has(rule.label)) continue;
    if (rule.pattern.test(windowText)) {
      usedLabels.add(rule.label);
      return rule.label;
    }
  }
  return null;
}

/**
 * hex 코드에 대응하는 색상 단어들을 돌려준다(역방향 조회) -- promptPriority
 * 모듈의 충돌 감지가 "금지 색상(hex)이 DB 예시 프롬프트 텍스트에 색상
 * 단어로 언급됐는지" 판단할 때 재사용한다. 이 표에 없는 커스텀 hex는
 * 단어로 매칭할 수 없어 빈 배열을 반환한다(알려진 한계, Phase 1 수용).
 */
export function getColorNameHints(hex: string): string[] {
  const normalized = hex.toLowerCase();
  const hints: string[] = [];
  for (const rule of COLOR_KEYWORD_RULES) {
    if (rule.hex.toLowerCase() !== normalized) continue;
    const words = rule.pattern.source.split("|");
    hints.push(...words);
  }
  return hints;
}

export function suggestColorSwatchesFromNotes(text: string | null | undefined): ColorSwatch[] | null {
  if (!text || !text.trim()) return null;

  const rawMatches: RawColorMatch[] = [];
  for (const rule of COLOR_KEYWORD_RULES) {
    for (const m of text.matchAll(rule.pattern)) {
      rawMatches.push({ index: m.index, length: m[0].length, hex: rule.hex });
    }
  }
  rawMatches.sort((a, b) => a.index - b.index);

  const seenHex = new Set<string>();
  const usedLabels = new Set<string>();
  const swatches: ColorSwatch[] = [];
  let ordinal = 0;

  for (const match of rawMatches) {
    if (swatches.length >= MAX_SUGGESTED_SWATCHES) break;
    if (seenHex.has(match.hex)) continue;
    seenHex.add(match.hex);
    ordinal += 1;
    const label = findNearbyRoleLabel(text, match, usedLabels) ?? `색상 ${ordinal}`;
    swatches.push({ hex: match.hex, label });
  }

  return swatches.length >= MIN_SUGGESTED_SWATCHES ? swatches : null;
}
