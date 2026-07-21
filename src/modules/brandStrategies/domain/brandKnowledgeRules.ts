/**
 * Interview answers -> Brand Knowledge mapping. Ported from the deleted
 * brandBriefs module's brandBriefRules.ts (that module used to sit between
 * the Interview and Aster Brain purely as a persisted, versioned copy of
 * this same deterministic inference -- brand_brief and brand_strategy
 * overlapped almost entirely, so Aster Brain now runs this directly on raw
 * interview answers instead of a separately generated/reviewed Brief).
 */

export interface BrandKnowledgeFields {
  industry: string;
  mission: string;
  vision: string;
  values: string[];
  positioning: string;
  audience: string;
  tone: string;
  personality: string;
  visualDirection: string;
  tagline: string;
  keywords: string[];
  preferredColor: string;
  typographyDirection: string;
}

function splitList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[,、·\/\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const TONE_KEYWORDS: { pattern: RegExp; tone: string }[] = [
  { pattern: /편안|따뜻|아늑|친근/, tone: "친근하고 따뜻한" },
  { pattern: /전문|신뢰|정확/, tone: "전문적이고 신뢰감 있는" },
  { pattern: /고급|프리미엄|세련/, tone: "세련되고 고급스러운" },
  { pattern: /활기|젊|트렌디|재미/, tone: "활기차고 트렌디한" },
];

function inferTone(desiredImpression: string): string {
  const match = TONE_KEYWORDS.find((k) => k.pattern.test(desiredImpression));
  return match?.tone ?? "균형 잡히고 진정성 있는";
}

/**
 * Deterministic, no AI involved -- fills the fields that genuinely need
 * inference (tagline/vision/positioning/tone/personality/keywords/visual
 * direction) with a topically-relevant placeholder derived from the 4
 * interview answers (brandName/industry/purpose/targetAudience).
 */
export function buildBrandKnowledgeFields(answers: Record<string, string>): BrandKnowledgeFields {
  const brandName = answers.brandName ?? "";
  const industry = answers.industry ?? "";
  const mission = answers.purpose ?? "";
  const primaryAudience = answers.targetAudience ?? "";
  const coreValues = splitList(answers.coreValues);
  const tone = inferTone(answers.desiredImpression ?? "");

  const preferredColor = "브랜드 톤에 맞는 중성 계열 컬러";
  const typographyDirection = "가독성 높은 산세리프";
  const preferredStyle = "미니멀";
  const preferredSymbol = "심플한 기하학적 심볼";

  return {
    industry,
    mission,
    vision: `${brandName || "브랜드"}는 ${industry || "이 분야"}에서 ${primaryAudience || "고객"}에게 꾸준히 신뢰받는 브랜드로 성장한다.`,
    values: coreValues,
    positioning: `${industry || "업종"} 내에서 ${tone} 이미지로 ${primaryAudience || "타깃 고객"}에게 다가가는 브랜드.`,
    audience: primaryAudience,
    tone,
    personality: tone,
    visualDirection: [preferredStyle, preferredColor, preferredSymbol, typographyDirection].join(", "),
    tagline: `${brandName || "우리 브랜드"} — ${(answers.desiredImpression ?? "") || "당신을 위한 선택"}`,
    keywords: [industry, ...coreValues].filter(Boolean).slice(0, 5),
    preferredColor,
    typographyDirection,
  };
}
