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
  /** reason의 한국어 문장을 화면에서 다시 조립할 때 쓰는 원자료(매칭된 키워드) -- 언어별로 다시 번역해 보여줄 때 사용한다. */
  matchedKeywords: string[];
  representativeSubStyle: string;
}
