export interface Style {
  id: string;
  name: string;
  slug: string;
  level: 1 | 2 | 3;
  parentId: string | null;
  category: string;
  keywords: string[];
  description: string;
}

export interface StyleSelection {
  id: string;
  projectId: string;
  primaryStyleId: string;
  secondaryStyleIds: string[];
  createdAt: Date;
}

export interface StyleRecommendation {
  style: Style;
  score: number;
  reason: string;
  alternatives: Style[];
}
