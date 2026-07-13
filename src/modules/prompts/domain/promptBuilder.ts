import type { BrandBriefData } from "@/modules/brandBriefs/domain/BrandBrief";
import type { BrandStrategyProfile } from "@/modules/brandStrategies/domain/BrandStrategy";
import type { Style } from "@/modules/styles/domain/Style";
import type { PromptLayers } from "@/modules/prompts/domain/Prompt";
import { SAFETY_CONSTRAINTS_TEXT, applySafetyRules } from "@/modules/prompts/domain/promptSafety";

const SYSTEM_INSTRUCTIONS =
  "당신은 ASTER의 브랜드 비주얼 아이덴티티 생성 엔진입니다. 브랜드의 방향성과 선택된 " +
  "디자인 스타일을 반영하여 로고/비주얼 컨셉 이미지를 생성하기 위한 지시를 따릅니다.";

const GENERATION_OBJECTIVE =
  "브랜드의 로고 및 비주얼 아이덴티티 컨셉 이미지를 생성한다. 텍스트가 아닌 시각적 방향성에 집중한다.";

/**
 * 14_PRD_PromptEngine.md "Prompt Layers": deterministic composition from
 * Brand Brief + Brand Strategy + selected Style, so identical inputs
 * always produce identical layers (and therefore an identical hash --
 * "동일 입력 시 동일 Prompt 재현").
 */
export function buildPromptLayers(input: {
  brief: BrandBriefData;
  strategy: BrandStrategyProfile;
  primaryStyle: Style;
  secondaryStyles: Style[];
}): PromptLayers {
  const brandContext =
    `브랜드명: ${input.brief.brandName}. 업종: ${input.brief.industry}. ` +
    `미션: ${input.brief.mission}. 톤: ${input.strategy.toneAndManner}. ` +
    `성격: ${input.strategy.personality}. 포지셔닝: ${input.strategy.positioning}.`;

  const styleNames = [input.primaryStyle.name, ...input.secondaryStyles.map((s) => s.name)].join(", ");
  const styleContext = `디자인 스타일: ${styleNames}. ${input.primaryStyle.description}`;

  return {
    systemInstructions: SYSTEM_INSTRUCTIONS,
    brandContext,
    styleContext,
    generationObjective: GENERATION_OBJECTIVE,
    safetyConstraints: SAFETY_CONSTRAINTS_TEXT,
  };
}

export interface ComposedPrompt {
  systemPrompt: string;
  userPrompt: string;
  flaggedTerms: string[];
}

/**
 * "시스템 프롬프트와 사용자 프롬프트 분리": system carries the fixed
 * instructions + safety constraints (Layer 1 + 5), user carries the
 * brand-specific content (Layer 2 + 3 + 4). Safety rules run last, over
 * the fully composed text, per that PRD's explicit instruction.
 */
export function composePrompt(layers: PromptLayers): ComposedPrompt {
  const rawSystemPrompt = [layers.systemInstructions, layers.safetyConstraints].join("\n\n");
  const rawUserPrompt = [layers.brandContext, layers.styleContext, layers.generationObjective].join("\n\n");

  const systemResult = applySafetyRules(rawSystemPrompt);
  const userResult = applySafetyRules(rawUserPrompt);

  return {
    systemPrompt: systemResult.text,
    userPrompt: userResult.text,
    flaggedTerms: [...systemResult.flaggedTerms, ...userResult.flaggedTerms],
  };
}
