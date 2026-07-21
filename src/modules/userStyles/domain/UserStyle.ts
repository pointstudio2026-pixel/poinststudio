export interface UserStyleCategory {
  id: string;
  userId: string;
  name: string;
  /** 업로드 시 1회 비전 분석으로 뽑은 시각적 스타일 텍스트. 분석 전/실패 시 null. */
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStyleReference {
  id: string;
  categoryId: string;
  storageKey: string;
  contentType: string;
  createdAt: Date;
}

export interface ProjectUserStyleSelection {
  id: string;
  projectId: string;
  userStyleCategoryId: string;
  createdAt: Date;
}
