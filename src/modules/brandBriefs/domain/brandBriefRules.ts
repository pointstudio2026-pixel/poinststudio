import type { BrandBriefData } from "@/modules/brandBriefs/domain/BrandBrief";

type RuleBasedFields = Pick<
  BrandBriefData,
  | "brandName"
  | "industry"
  | "description"
  | "mission"
  | "coreValues"
  | "primaryAudience"
  | "customerProblems"
  | "desiredImpression"
  | "avoidKeywords"
>;

type EnhancedFields = Omit<BrandBriefData, keyof RuleBasedFields>;

function splitList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[,、·\/\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Directly maps interview answers onto Brand Brief fields — deterministic,
 * no AI involved. This is the part of "AI 구조화" that doesn't actually
 * need inference.
 */
export function buildRuleBasedFields(answers: Record<string, string>): RuleBasedFields {
  return {
    brandName: answers.brandName ?? "",
    industry: answers.industry ?? "",
    description: answers.purpose ?? "",
    mission: answers.purpose ?? "",
    coreValues: splitList(answers.coreValues),
    primaryAudience: answers.targetAudience ?? "",
    customerProblems: answers.competitiveContext ?? "",
    desiredImpression: answers.desiredImpression ?? "",
    avoidKeywords: splitList(answers.avoidKeywords),
  };
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
 * Fills the fields that genuinely need inference (tagline/vision/
 * positioning/tone/personality/keywords/visual direction) with a
 * deterministic, topically-relevant placeholder. Used as-is when the AI
 * provider is the Mock, and as a fallback if a real provider's JSON
 * response fails to parse.
 */
export function buildFallbackEnhancedFields(
  answers: Record<string, string>,
  base: RuleBasedFields,
): EnhancedFields {
  const tone = inferTone(base.desiredImpression);
  return {
    tagline: `${base.brandName || "우리 브랜드"} — ${base.desiredImpression || "당신을 위한 선택"}`,
    vision: `${base.brandName || "브랜드"}는 ${base.industry || "이 분야"}에서 ${base.primaryAudience || "고객"}에게 꾸준히 신뢰받는 브랜드로 성장한다.`,
    positioning: `${base.industry || "업종"} 내에서 ${tone} 이미지로 ${base.primaryAudience || "타깃 고객"}에게 다가가는 브랜드.`,
    secondaryAudience: "",
    brandTone: tone,
    brandPersonality: tone,
    keywords: [base.industry, ...base.coreValues].filter(Boolean).slice(0, 5),
    preferredStyle: "미니멀",
    preferredColor: "브랜드 톤에 맞는 중성 계열 컬러",
    preferredSymbol: "심플한 기하학적 심볼",
    typographyDirection: "가독성 높은 산세리프",
  };
}
