import { getColorNameHints } from "@/modules/colorPalettes/domain/interviewColorSuggestion";
import type { ConflictCategory, HardConstraintSet } from "@/modules/promptPriority/domain/HardConstraint";

/** DB(현재는 TrainingExample)가 만들어내는 "추천" -- Phase 1에서 사용자 하드제약과 충돌 가능한 유일한 소스. */
export interface DbSuggestion {
  field: "color" | "style";
  category: ConflictCategory;
  /** 이 추천이 나온 후보를 식별하는 값(예: trainingExampleId). */
  sourceRef: string;
  /** 후보의 원문 텍스트(토큰화해서 매칭한다) -- TrainingExample.prompt. */
  text: string;
  /** 사람이 읽을 수 있는 "이 추천이 노리는 목적" -- goalPreservationRules가 대체 문구를 만들 때 쓴다. Phase 1은 후보 텍스트 자체를 목적으로 취급(별도 reason 필드가 DB에 없음). */
  reason: string;
}

export interface ConflictResult {
  category: ConflictCategory;
  field: string;
  userValue: string;
  discardedSuggestion: string;
  resolution: "KEEP_USER_DISCARD_SUGGESTION";
  preservedGoalVia: string;
  sourceRef: string;
}

/**
 * DB 추천 후보 중 사용자 하드제약과 충돌하는 것을 찾는다. 대소문자 무시
 * substring 매칭 -- mockupRules.ts/styleRules.ts/logoStyleRules.ts/
 * trainingExampleRules.ts와 동일한 매칭 방식(결정론적, AI 호출 없음).
 * 충돌이 없으면 빈 배열.
 */
export function detectDbConflicts(
  hardConstraints: HardConstraintSet,
  suggestions: DbSuggestion[],
  preserveGoal: (reason: string) => string,
): ConflictResult[] {
  const conflicts: ConflictResult[] = [];

  for (const suggestion of suggestions) {
    const text = suggestion.text.toLowerCase();

    if (suggestion.field === "color") {
      for (const forbiddenHex of hardConstraints.forbiddenColors) {
        const hints = [forbiddenHex.toLowerCase(), ...getColorNameHints(forbiddenHex).map((h) => h.toLowerCase())];
        if (hints.some((hint) => text.includes(hint))) {
          conflicts.push({
            category: "COLOR_CONFLICT",
            field: "color",
            userValue: forbiddenHex,
            discardedSuggestion: suggestion.sourceRef,
            resolution: "KEEP_USER_DISCARD_SUGGESTION",
            preservedGoalVia: preserveGoal(suggestion.reason),
            sourceRef: suggestion.sourceRef,
          });
          break;
        }
      }
    }

    if (suggestion.field === "style") {
      for (const forbiddenStyle of hardConstraints.forbiddenStyleNames) {
        if (text.includes(forbiddenStyle.toLowerCase())) {
          conflicts.push({
            category: "STYLE_CONFLICT",
            field: "style",
            userValue: forbiddenStyle,
            discardedSuggestion: suggestion.sourceRef,
            resolution: "KEEP_USER_DISCARD_SUGGESTION",
            preservedGoalVia: preserveGoal(suggestion.reason),
            sourceRef: suggestion.sourceRef,
          });
          break;
        }
      }
    }
  }

  return conflicts;
}

/** 사용자가 직접 입력한 금지 목록과 필수 목록이 리터럴하게 겹치는지만 확인한다(퍼지 매칭 없음, 오탐 위험 최소화). */
export function detectInternalOverlap(hardConstraints: HardConstraintSet): ConflictResult[] {
  const conflicts: ConflictResult[] = [];

  const forbiddenColorSet = new Set(hardConstraints.forbiddenColors.map((c) => c.toLowerCase()));
  for (const required of hardConstraints.requiredColors) {
    if (forbiddenColorSet.has(required.hex.toLowerCase())) {
      conflicts.push({
        category: "COLOR_CONFLICT",
        field: "color",
        userValue: required.hex,
        discardedSuggestion: required.hex,
        resolution: "KEEP_USER_DISCARD_SUGGESTION",
        preservedGoalVia: "사용자가 같은 색상을 필수와 금지 양쪽에 지정 -- 필수 목록을 우선한다.",
        sourceRef: "INTERNAL_USER_INPUT",
      });
    }
  }

  const forbiddenElementSet = new Set(hardConstraints.forbiddenElements.map((e) => e.toLowerCase()));
  for (const required of hardConstraints.requiredElements) {
    if (forbiddenElementSet.has(required.toLowerCase())) {
      conflicts.push({
        category: "INTERNAL_USER_CONFLICT",
        field: "element",
        userValue: required,
        discardedSuggestion: required,
        resolution: "KEEP_USER_DISCARD_SUGGESTION",
        preservedGoalVia: "사용자가 같은 요소를 필수와 금지 양쪽에 지정 -- 필수 목록을 우선한다.",
        sourceRef: "INTERNAL_USER_INPUT",
      });
    }
  }

  return conflicts;
}
