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
  /** 사용자가 명시적으로 배제한 로고 스타일 카테고리 -- 우선순위 시스템의 하드 제약조건. */
  forbiddenCategoryIds: string[];
  createdAt: Date;
}

export interface LogoStyleRecommendation {
  category: LogoStyleCategory;
  score: number;
  reason: string;
  representativeSubStyle: string;
}
