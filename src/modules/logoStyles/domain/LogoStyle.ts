export interface LogoStyleCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  subStyles: string[];
  keywords: string[];
  sampleImageUrl: string;
  sortOrder: number;
}

export interface LogoStyleSelection {
  id: string;
  projectId: string;
  categoryIds: string[];
  primaryCategoryId: string;
  createdAt: Date;
}

export interface LogoStyleRecommendation {
  category: LogoStyleCategory;
  score: number;
  reason: string;
  representativeSubStyle: string;
}
