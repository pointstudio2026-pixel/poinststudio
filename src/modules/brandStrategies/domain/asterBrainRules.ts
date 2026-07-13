import type { BrandBriefData } from "@/modules/brandBriefs/domain/BrandBrief";
import type {
  BrandKnowledge,
  BrandStrategyProfile,
  ConfidenceLevel,
  StyleCandidate,
} from "@/modules/brandStrategies/domain/BrandStrategy";

/**
 * Deterministic Brand Brief -> Brand Knowledge mapping (13_PRD_AsterBrain.md
 * "Reasoning Pipeline" steps 2-5). No inference needed here, only
 * normalization/composition of fields the Brand Brief already resolved.
 * `confidenceNotes` and `reasoningSummary` are filled in by the caller once
 * confidence has been calculated and the reasoning text composed.
 */
export function buildBrandKnowledge(brief: BrandBriefData): Omit<BrandKnowledge, "confidenceNotes" | "reasoningSummary"> {
  return {
    mission: brief.mission,
    vision: brief.vision,
    values: brief.coreValues,
    positioning: brief.positioning,
    audience: [brief.primaryAudience, brief.secondaryAudience].filter(Boolean).join(" / "),
    tone: brief.brandTone,
    personality: brief.brandPersonality,
    visualDirection: [brief.preferredStyle, brief.preferredColor, brief.preferredSymbol, brief.typographyDirection]
      .filter(Boolean)
      .join(", "),
  };
}

const ARCHETYPE_KEYWORDS: { pattern: RegExp; archetype: string }[] = [
  { pattern: /전문|신뢰|정확/, archetype: "전문가 (The Sage)" },
  { pattern: /편안|따뜻|친근/, archetype: "동반자 (The Everyman)" },
  { pattern: /고급|프리미엄|세련/, archetype: "지배자 (The Ruler)" },
  { pattern: /활기|젊|트렌디|재미/, archetype: "탐험가 (The Explorer)" },
];

function inferArchetype(tone: string, personality: string): string {
  const match = ARCHETYPE_KEYWORDS.find((k) => k.pattern.test(tone) || k.pattern.test(personality));
  return match?.archetype ?? "혁신가 (The Creator)";
}

/**
 * Brand Brief -> Brand Strategy draft (11_PRD_BrandStrategy.md "Outputs").
 * Every recommendation carries a `reason`, per that PRD's Business Rules.
 */
export function buildStrategyProfile(
  brief: BrandBriefData,
  visualDirection: string,
): BrandStrategyProfile {
  const archetype = inferArchetype(brief.brandTone, brief.brandPersonality);
  return {
    positioning: brief.positioning,
    coreMessage: brief.tagline,
    toneAndManner: brief.brandTone,
    personality: brief.brandPersonality,
    brandArchetype: archetype,
    visualDirection,
    recommendedStyles: [
      { value: brief.preferredStyle, reason: `브랜드 톤(${brief.brandTone})과 어울리는 스타일입니다.` },
    ],
    recommendedColors: [
      { value: brief.preferredColor, reason: `${archetype} 이미지를 뒷받침하는 컬러 방향입니다.` },
    ],
    recommendedTypography: [
      { value: brief.typographyDirection, reason: `${brief.primaryAudience || "타깃 고객"}에게 가독성 있게 다가가는 서체 방향입니다.` },
    ],
    recommendedSymbols: [
      { value: brief.preferredSymbol, reason: `브랜드 성격(${brief.brandPersonality})을 시각적으로 요약합니다.` },
    ],
  };
}

const STYLE_TAXONOMY_KEYWORDS: { pattern: RegExp; name: string }[] = [
  { pattern: /미니멀|심플/, name: "Minimal" },
  { pattern: /럭셔리|고급|프리미엄/, name: "Luxury" },
  { pattern: /빈티지|헤리티지|클래식/, name: "Heritage" },
  { pattern: /테크|미래|디지털/, name: "Tech" },
  { pattern: /경쾌|플레이풀|재미/, name: "Playful" },
  { pattern: /자연|오가닉|친환경/, name: "Organic" },
  { pattern: /실험적|아방가르드/, name: "Experimental" },
];

/**
 * Preliminary style tags from the 10 Level-1 categories in
 * 12_PRD_StyleEngine.md's taxonomy. The full style library / conflict
 * rules are Task-011's scope -- this only hands off a starting point.
 */
export function buildStyleCandidates(brief: BrandBriefData): StyleCandidate[] {
  const match = STYLE_TAXONOMY_KEYWORDS.find((k) => k.pattern.test(brief.preferredStyle));
  const primary = match?.name ?? "Modern";
  const secondary = primary === "Modern" ? "Minimal" : "Modern";

  return [
    {
      name: primary,
      reason: `선호 스타일("${brief.preferredStyle}")과 브랜드 톤(${brief.brandTone})을 반영한 1순위 후보입니다.`,
    },
    {
      name: secondary,
      reason: `${brief.industry || "해당 업종"}에서 무난하게 조합 가능한 보완 후보입니다.`,
    },
  ];
}

export function buildFallbackReasoningSummary(brief: BrandBriefData, profile: BrandStrategyProfile): string {
  return (
    `${brief.brandName || "이 브랜드"}는 ${brief.industry || "해당 업종"}에서 ${profile.brandArchetype} 성격으로, ` +
    `${profile.toneAndManner || "고유한"} 톤을 통해 ${brief.primaryAudience || "타깃 고객"}에게 다가갑니다. ` +
    `포지셔닝: ${profile.positioning || "차별화된 방향성을 정의하는 중입니다."}`
  );
}

interface ConfidenceInput {
  competitiveContext?: string;
  avoidKeywords?: string;
  briefSource: "ai" | "user";
  secondaryAudience: string;
}

export interface ConfidenceResult {
  score: number;
  level: ConfidenceLevel;
  notes: string;
}

/**
 * Rule-based confidence score (13_PRD_AsterBrain.md "Confidence Model").
 * Starts from a 0.4 base (a completed interview always yields *some*
 * signal) and adds weight for each optional signal that's actually
 * present -- richer optional interview answers, a user-reviewed Brand
 * Brief, and a filled-in secondary audience. Low confidence surfaces
 * concrete missing inputs so the UI can suggest follow-up questions.
 */
export function calculateConfidence(input: ConfidenceInput): ConfidenceResult {
  const missing: string[] = [];
  let score = 0.4;

  if (input.competitiveContext?.trim()) {
    score += 0.15;
  } else {
    missing.push("경쟁 환경 정보");
  }

  if (input.avoidKeywords?.trim()) {
    score += 0.15;
  } else {
    missing.push("피하고 싶은 키워드");
  }

  if (input.briefSource === "user") {
    score += 0.15;
  } else {
    missing.push("Brand Brief 검토");
  }

  if (input.secondaryAudience?.trim()) {
    score += 0.15;
  } else {
    missing.push("보조 타깃 고객");
  }

  const level: ConfidenceLevel = score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low";
  const notes =
    missing.length === 0
      ? "충분한 정보를 바탕으로 분석했습니다."
      : `다음 정보가 보완되면 신뢰도가 높아집니다: ${missing.join(", ")}.`;

  return { score, level, notes };
}
