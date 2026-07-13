export interface Project {
  id: string;
  userId: string;
  name: string;
  status: string;
  currentStep: string;
  isFavorite: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 08_PRD_ProjectWorkspace.md Left Sidebar / Core Workflow order.
export const WORKSPACE_STEPS = [
  { key: "brand_interview", label: "Brand Interview" },
  { key: "brand_brief", label: "Brand Brief" },
  { key: "brand_strategy", label: "Brand Strategy" },
  { key: "style", label: "Style" },
  { key: "generation", label: "Generation" },
  { key: "concept_board", label: "Concept Board" },
  { key: "mockup", label: "Mockup" },
] as const;
