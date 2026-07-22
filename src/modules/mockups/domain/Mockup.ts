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
  /** 완성된 결과물 전체를 크게 합성할 때 쓰는 배치 영역 -- 값이 없으면 로고 마크 모드로 폴백. */
  fullDesignPlacementArea?: { xPct: number; yPct: number; widthPct: number; heightPct: number } | null;
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
