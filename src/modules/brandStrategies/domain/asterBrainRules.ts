import type { BrandKnowledgeFields } from "@/modules/brandStrategies/domain/brandKnowledgeRules";
import { buildBrandKnowledgeFields } from "@/modules/brandStrategies/domain/brandKnowledgeRules";
import type {
  BrandKnowledge,
  BrandStrategyData,
  BrandStrategyProfile,
  ConfidenceLevel,
} from "@/modules/brandStrategies/domain/BrandStrategy";

/**
 * Interview answers -> Brand Knowledge mapping (13_PRD_AsterBrain.md
 * "Reasoning Pipeline" steps 2-5). Deterministic; `confidenceNotes` and
 * `reasoningSummary` are filled in by the caller once confidence has been
 * calculated and the reasoning text composed.
 */
export function buildBrandKnowledge(
  answers: Record<string, string>,
): Omit<BrandKnowledge, "confidenceNotes" | "reasoningSummary"> {
  return buildBrandKnowledgeFields(answers);
}

interface ArchetypeTemplate {
  archetype: string;
  toneAndManner: string;
  positioningAngle: string;
}

/**
 * 3 fixed, deliberately distinct archetype directions used both as the
 * candidate-generation fallback (Mock provider / parse failure) and as the
 * structural skeleton an AI-generated response is expected to vary. Picking
 * 1 of 3 is the new Brand Strategy step's core interaction (mirrors Style
 * selection's recommend-then-select pattern).
 */
const ARCHETYPE_TEMPLATES: ArchetypeTemplate[] = [
  {
    archetype: "전문가 (The Sage)",
    toneAndManner: "전문적이고 신뢰감 있는",
    positioningAngle: "전문성과 신뢰를 앞세워",
  },
  {
    archetype: "동반자 (The Everyman)",
    toneAndManner: "친근하고 따뜻한",
    positioningAngle: "편안함과 친근함을 앞세워",
  },
  {
    archetype: "지배자 (The Ruler)",
    toneAndManner: "세련되고 고급스러운",
    positioningAngle: "세련됨과 프리미엄 이미지를 앞세워",
  },
];

export function buildStrategyProfile(
  answers: Record<string, string>,
  knowledge: BrandKnowledgeFields,
  template: ArchetypeTemplate,
): BrandStrategyProfile {
  return {
    positioning: `${answers.industry || "업종"} 내에서 ${template.positioningAngle} ${knowledge.audience || "타깃 고객"}에게 다가가는 브랜드.`,
    coreMessage: knowledge.tagline,
    toneAndManner: template.toneAndManner,
    personality: template.toneAndManner,
    brandArchetype: template.archetype,
    visualDirection: knowledge.visualDirection,
    recommendedStyles: [
      { value: "미니멀", reason: `${template.archetype} 방향과 어울리는 스타일입니다.` },
    ],
    recommendedColors: [
      { value: knowledge.preferredColor, reason: `${template.archetype} 이미지를 뒷받침하는 컬러 방향입니다.` },
    ],
    recommendedTypography: [
      { value: knowledge.typographyDirection, reason: `${knowledge.audience || "타깃 고객"}에게 가독성 있게 다가가는 서체 방향입니다.` },
    ],
    recommendedSymbols: [
      { value: "심플한 기하학적 심볼", reason: `브랜드 성격(${template.toneAndManner})을 시각적으로 요약합니다.` },
    ],
  };
}

export function buildFallbackStrategyProfiles(
  answers: Record<string, string>,
  knowledge: BrandKnowledgeFields,
): BrandStrategyProfile[] {
  return ARCHETYPE_TEMPLATES.map((template) => buildStrategyProfile(answers, knowledge, template));
}

export function buildFallbackReasoningSummary(
  answers: Record<string, string>,
  profile: BrandStrategyProfile,
): string {
  return (
    `${answers.brandName || "이 브랜드"}는 ${answers.industry || "해당 업종"}에서 ${profile.brandArchetype} 성격으로, ` +
    `${profile.toneAndManner || "고유한"} 톤을 통해 ${answers.targetAudience || "타깃 고객"}에게 다가갑니다. ` +
    `포지셔닝: ${profile.positioning || "차별화된 방향성을 정의하는 중입니다."}`
  );
}

/**
 * "브랜드 전략"/"로고 스타일" 단계가 없는(브랜딩 & 로고가 아닌) 작업물
 * 유형을 위한 즉석 대체 데이터 -- Aster Brain의 Mock 프로바이더/AI 실패
 * 폴백과 완전히 동일한 결정론적 함수만 조합해서 쓴다(새 AI 호출도, 새
 * 비즈니스 로직도 추가하지 않는다). BuildPromptUseCase/BuildConceptBoardUseCase가
 * Brand Strategy 자체가 존재하지 않는 프로젝트에서 이 함수로 대체한다.
 */
export function buildFallbackBrandStrategyData(answers: Record<string, string>): BrandStrategyData {
  const knowledgeFields = buildBrandKnowledge(answers);
  const [profile] = buildFallbackStrategyProfiles(answers, knowledgeFields);
  const reasoningSummary = buildFallbackReasoningSummary(answers, profile!);
  const { score } = calculateConfidence(answers);

  return {
    brandKnowledge: { ...knowledgeFields, confidenceNotes: "", reasoningSummary },
    brandStrategy: profile!,
    confidenceScore: score,
  };
}

export interface ConfidenceResult {
  score: number;
  level: ConfidenceLevel;
  notes: string;
}

// desiredImpression은 인터뷰의 필수 질문(항상 답변됨)이라 여기 포함한다 --
// 안 그러면 "항상 답변되는 필수 질문"이 매번 optional 가산점(+0.1)으로
// 잘못 집계돼 모든 프로젝트의 기본 confidence가 부풀려진다.
const REQUIRED_ANSWER_KEYS = new Set([
  "brandName",
  "industry",
  "purpose",
  "targetAudience",
  "desiredImpression",
]);

/**
 * Rule-based confidence score. A completed interview (5 required answers)
 * always yields a 0.5 base; each additional answered question (industry-
 * specific follow-ups, AI follow-up questions) adds richness signal.
 */
export function calculateConfidence(answers: Record<string, string>): ConfidenceResult {
  const optionalAnswered = Object.entries(answers).filter(
    ([key, value]) => !REQUIRED_ANSWER_KEYS.has(key) && value?.trim(),
  ).length;

  const score = Math.min(0.5 + optionalAnswered * 0.1, 1);
  const level: ConfidenceLevel = score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low";
  const notes =
    optionalAnswered === 0
      ? "추가 질문에 답변할수록 분석 신뢰도가 높아집니다."
      : "충분한 정보를 바탕으로 분석했습니다.";

  return { score, level, notes };
}
