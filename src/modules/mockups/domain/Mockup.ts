import type { GenerationStatus } from "@/modules/generations/domain/Generation";

export const MOCKUP_CATEGORIES = [
  "business_card",
  "signboard",
  "mobile_app",
  "website_hero",
  "brochure",
  "poster",
] as const;

export type MockupCategory = (typeof MOCKUP_CATEGORIES)[number];

export interface MockupTemplate {
  id: string;
  category: MockupCategory;
  name: string;
  slug: string;
  description: string;
  backgroundUrl: string;
  placementArea: { xPct: number; yPct: number; widthPct: number; heightPct: number };
}

export interface MockupProject {
  id: string;
  projectId: string;
  generationVersionId: string;
  sourceImageIndex: number;
  templateId: string;
  status: GenerationStatus;
  resultImageUrl: string | null;
  thumbnailUrl: string | null;
  provider: string | null;
  isFavorite: boolean;
  errorMessage: string | null;
  costAmount: number | null;
  createdAt: Date;
  completedAt: Date | null;
}
