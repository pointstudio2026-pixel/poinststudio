export const CONCEPT_BOARD_SECTIONS = [
  "hero_image",
  "brand_summary",
  "core_values",
  "style_keywords",
  "color_palette",
  "typography_direction",
  "logo_concepts",
  "design_notes",
] as const;

export type ConceptBoardSectionKey = (typeof CONCEPT_BOARD_SECTIONS)[number];

export interface ColorSwatch {
  hex: string;
  label: string;
}

export interface ConceptBoardData {
  heroImageUrl: string | null;
  brandSummary: string;
  coreValues: string[];
  styleKeywords: string[];
  colorPalette: ColorSwatch[];
  typographyDirection: string;
  logoConceptImageUrls: string[];
  designNotes: string;
  sectionOrder: ConceptBoardSectionKey[];
}

export type ConceptBoardVersionSource = "ai" | "user";

export interface ConceptBoardVersion {
  id: string;
  conceptBoardId: string;
  versionNumber: number;
  data: ConceptBoardData;
  source: ConceptBoardVersionSource;
  createdAt: Date;
}

export interface ConceptBoard {
  id: string;
  projectId: string;
  currentVersion: ConceptBoardVersion;
}
