export interface Style {
  id: string;
  name: string;
  slug: string;
  /** 0 = 작업물 유형(브랜딩&로고/포스터/...), 1 = 대분류, 2 = 중분류, 3 = 소분류(선택 가능). */
  level: 0 | 1 | 2 | 3;
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
  /** 사용자가 명시적으로 배제한 스타일 -- 우선순위 시스템의 하드 제약조건. */
  forbiddenStyleIds: string[];
  createdAt: Date;
}

export interface StyleRecommendation {
  style: Style;
  score: number;
  reason: string;
  alternatives: Style[];
}
