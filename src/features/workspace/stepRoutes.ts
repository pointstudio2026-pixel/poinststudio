import { getWorkspaceSteps } from "@/modules/projects/domain/Project";
import type { MessageKey } from "@/shared/i18n/messages/types";

// 아직 구현되지 않은 단계는 여기 없으면 자동으로 "다음 작업에서 구현됩니다"로 표시된다.
export const STEP_ROUTES: Partial<Record<string, string>> = {
  deliverable_type: "deliverable-type",
  brand_interview: "interview",
  style: "styles",
  brand_strategy: "aster-brain",
  logo_style: "logo-style",
  logo_choice: "logo-choice",
  generation: "generation",
  concept_board: "concept-board",
  mockup: "mockups",
};

// Project.ts의 workspace step label은 도메인 레이어라 한국어 고정 문구다
// (프레임워크/i18n 비의존 유지) -- 실제 화면에 보여줄 때는 이 key로 번역
// 문구를 찾는다(ProjectSidebar.tsx/NextStepButton.tsx).
export const STEP_LABEL_MESSAGE_KEYS: Record<string, MessageKey> = {
  deliverable_type: "workspaceSteps.deliverableType",
  brand_interview: "workspaceSteps.brandInterview",
  style: "workspaceSteps.style",
  brand_strategy: "workspaceSteps.brandStrategy",
  logo_style: "workspaceSteps.logoStyle",
  logo_choice: "workspaceSteps.logoChoice",
  generation: "workspaceSteps.generation",
  concept_board: "workspaceSteps.conceptBoard",
  mockup: "workspaceSteps.mockup",
};

export function getNextStep(
  currentStepKey: string,
  deliverableType: string | null | undefined,
): { key: string; label: string; route: string } | null {
  const steps = getWorkspaceSteps(deliverableType);
  const index = steps.findIndex((s) => s.key === currentStepKey);
  if (index === -1) return null;
  const next = steps[index + 1];
  if (!next) return null;
  const route = STEP_ROUTES[next.key];
  if (!route) return null;
  return { key: next.key, label: next.label, route };
}
