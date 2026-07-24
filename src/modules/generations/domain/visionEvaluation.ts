import type { InterviewAnswerRecord } from "@/modules/interviews/domain/Interview";
import type { HardConstraintSet } from "@/modules/promptPriority/domain/HardConstraint";

/**
 * Vision AI(이미지 입력 지원 GPT) 기반 생성 결과 판단 -- 2026-07-24 사용자
 * 승인. 순수 함수만 여기 둔다(프롬프트 조립/응답 파싱/점수 계산), 실제 API
 * 호출은 TextCompletionProvider(OpenAI만, visionEvaluationRouter.ts)가 맡는다.
 */
export interface VisionEvaluationScoreBlock {
  score: number;
  reasoning: string;
}

export interface VisionEvaluationResult {
  /** 금지 요소/색상이 실제로 이미지에 없고, 필수 요소/색상이 반영됐는지. */
  hardConstraintsRespected: boolean;
  /** 업종/목적/타깃/원하는 인상 등 브랜드 정보와 실제로 어울리는지. */
  brandAlignment: VisionEvaluationScoreBlock;
  /** 최신 브랜딩/로고 디자인 트렌드에 부합하는지. */
  trendAlignment: VisionEvaluationScoreBlock;
  /** 텍스트 깨짐/형태 뭉개짐 등 AI 생성 특유의 결함이 없는지. */
  technicalQuality: VisionEvaluationScoreBlock;
  /** 여러 시안이 그리드로 섞이지 않고 하나의 통일된 디자인인지. */
  singleConceptRespected: boolean;
  summary: string;
}

export interface VisionEvaluationPromptInput {
  imagePromptText: string;
  /** 브랜드명/업종/목적/타깃/원하는 인상을 사람이 읽는 한국어 문장으로 요약한 것. */
  brandContext: string;
  /** 하드 제약조건(금지/필수 요소·색상)을 한국어로 요약한 것 -- 없으면 빈 문자열. */
  constraintContext: string;
}

export function buildVisionEvaluationPrompt(input: VisionEvaluationPromptInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  const systemPrompt = [
    "당신은 브랜딩/로고 디자인 결과물을 심사하는 전문 디자인 감수자입니다.",
    "첨부된 이미지 한 장을 아래 5가지 기준으로 평가한 뒤, 반드시 순수 JSON 객체 하나만 출력하세요.",
    "설명, 인사말, 마크다운 코드펜스 없이 JSON만 출력해야 합니다.",
    "",
    "평가 기준:",
    "1. hardConstraintsRespected (boolean) — '필수 조건'에 명시된 금지 요소/색상이 이미지에 실제로 없고, 필수 요소/색상이 있다면 실제로 반영되었는지.",
    "2. brandAlignment (0~1 점수 + reasoning) — 이미지가 브랜드 정보(업종/목적/타깃/원하는 인상)와 실제로 어울리는지.",
    "3. trendAlignment (0~1 점수 + reasoning) — 2024년 이후 최신 브랜딩/로고 디자인 트렌드에 부합하는지(과도하게 복잡하거나 시대에 뒤떨어진 클립아트 스타일이 아닌지).",
    "4. technicalQuality (0~1 점수 + reasoning) — 텍스트 깨짐, 형태 뭉개짐, 비대칭 왜곡 등 AI 생성 특유의 결함이 없는지.",
    "5. singleConceptRespected (boolean) — 여러 개의 시안이 하나의 이미지 안에 그리드/무드보드 형태로 섞여 있지 않고, 하나의 통일된 디자인인지.",
    "",
    "정확히 아래 형식의 JSON만 출력하세요:",
    '{"hardConstraintsRespected": boolean, "brandAlignment": {"score": number, "reasoning": string}, "trendAlignment": {"score": number, "reasoning": string}, "technicalQuality": {"score": number, "reasoning": string}, "singleConceptRespected": boolean, "summary": string}',
    "모든 reasoning과 summary는 한국어로 간결하게(각 1문장) 작성하세요.",
  ].join("\n");

  const userPrompt = [
    `이미지 생성에 사용된 프롬프트: ${input.imagePromptText}`,
    "",
    `브랜드 정보: ${input.brandContext}`,
    input.constraintContext ? `필수 조건: ${input.constraintContext}` : "",
    "",
    "첨부된 이미지를 위 기준에 따라 평가해 JSON으로만 답하세요.",
  ]
    .filter(Boolean)
    .join("\n");

  return { systemPrompt, userPrompt };
}

/** 모델이 코드펜스나 부연 설명을 덧붙여도 첫 { ~ 마지막 } 구간만 잘라내 파싱한다. */
export function parseVisionEvaluationResponse(text: string): VisionEvaluationResult {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Vision 평가 응답에서 JSON을 찾을 수 없습니다.");
  }

  const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;

  const asScoreBlock = (value: unknown): VisionEvaluationScoreBlock => {
    const obj = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    const rawScore = typeof obj.score === "number" ? obj.score : 0;
    return {
      score: Math.min(1, Math.max(0, rawScore)),
      reasoning: typeof obj.reasoning === "string" ? obj.reasoning : "",
    };
  };

  return {
    hardConstraintsRespected: parsed.hardConstraintsRespected === true,
    brandAlignment: asScoreBlock(parsed.brandAlignment),
    trendAlignment: asScoreBlock(parsed.trendAlignment),
    technicalQuality: asScoreBlock(parsed.technicalQuality),
    singleConceptRespected: parsed.singleConceptRespected === true,
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
  };
}

/**
 * brandAlignment(0.4) + trendAlignment(0.3) + technicalQuality(0.3) 가중
 * 평균에, 두 boolean 게이트를 강한 상한으로 적용한다 -- 하드 제약을 어겼거나
 * 여러 시안이 한 이미지에 섞였다면 다른 항목 점수가 높아도 참고자료로 쓸
 * 만하지 않다고 판단한다(사용자가 원래 문제 삼았던 예시가 정확히 이 두
 * 케이스: "금지된 요소가 그려짐" / "여러 시안이 한 이미지에 섞임").
 */
export function computeVisionScore(result: VisionEvaluationResult): number {
  const weighted =
    result.brandAlignment.score * 0.4 + result.trendAlignment.score * 0.3 + result.technicalQuality.score * 0.3;

  let score = weighted;
  if (!result.hardConstraintsRespected) score = Math.min(score, 0.2);
  if (!result.singleConceptRespected) score = Math.min(score, 0.3);

  return Math.round(Math.min(1, Math.max(0, score)) * 100) / 100;
}

/** 인터뷰 답변에서 Vision 판단에 필요한 브랜드 맥락만 사람이 읽는 한국어 문장으로 요약한다. */
export function summarizeBrandContext(answers: InterviewAnswerRecord[]): string {
  const get = (key: string) => answers.find((a) => a.questionKey === key)?.answer;
  const parts: string[] = [];
  const brandName = get("brandName");
  const industry = get("industry");
  const purpose = get("purpose");
  const targetAudience = get("targetAudience");
  const desiredImpression = get("desiredImpression");
  if (brandName) parts.push(`브랜드명 "${brandName}"`);
  if (industry) parts.push(`업종: ${industry}`);
  if (purpose) parts.push(`목적: ${purpose}`);
  if (targetAudience) parts.push(`타깃 고객: ${targetAudience}`);
  if (desiredImpression) parts.push(`원하는 인상: ${desiredImpression}`);
  return parts.length > 0 ? parts.join(", ") : "브랜드 인터뷰 정보 없음";
}

/** 하드 제약조건을 사람이 읽는 한국어 문장으로 요약한다 -- 제약이 없으면 빈 문자열(프롬프트에서 이 줄 자체가 생략됨). */
export function summarizeHardConstraints(hardConstraints: HardConstraintSet | null): string {
  if (!hardConstraints) return "";
  const parts: string[] = [];
  if (hardConstraints.forbiddenColors.length > 0) parts.push(`금지 색상: ${hardConstraints.forbiddenColors.join(", ")}`);
  if (hardConstraints.requiredColors.length > 0) {
    parts.push(`필수 색상: ${hardConstraints.requiredColors.map((c) => c.label).join(", ")}`);
  }
  if (hardConstraints.forbiddenElements.length > 0) parts.push(`금지 요소: ${hardConstraints.forbiddenElements.join(", ")}`);
  if (hardConstraints.requiredElements.length > 0) parts.push(`필수 요소: ${hardConstraints.requiredElements.join(", ")}`);
  if (hardConstraints.forbiddenStyleNames.length > 0) {
    parts.push(`금지 스타일: ${hardConstraints.forbiddenStyleNames.join(", ")}`);
  }
  if (hardConstraints.forbiddenLogoCategoryNames.length > 0) {
    parts.push(`금지 로고 유형: ${hardConstraints.forbiddenLogoCategoryNames.join(", ")}`);
  }
  return parts.join(" / ");
}
