import { getWorkspaceSteps } from "@/modules/projects/domain/Project";

// 아직 구현되지 않은 단계는 여기 없으면 자동으로 "다음 작업에서 구현됩니다"로 표시된다.
export const STEP_ROUTES: Partial<Record<string, string>> = {
  deliverable_type: "deliverable-type",
  brand_interview: "interview",
  style: "styles",
  brand_strategy: "aster-brain",
  logo_style: "logo-style",
  generation: "generation",
  concept_board: "concept-board",
  mockup: "mockups",
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
