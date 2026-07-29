export interface Industry {
  id: string;
  name: string;
  /** 현재 요청 locale로 표시할 이름 -- ko거나 번역이 없으면 name과 같다.
   * 인터뷰 답변 저장 시에는 반드시 name(한국어 원문)을 써야 한다,
   * displayName이 아니다 -- promptBuilder.ts의 문자열 매칭 계약 때문. */
  displayName: string;
  seoSlug: string;
  category: string;
  description: string;
  recommendedColors: string[];
  recommendedLogoStyles: string[];
  recommendedTypography: string[];
  recommendedPersonality: string[];
  recommendedKeywords: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIndustryInput {
  name: string;
  seoSlug: string;
  category: string;
  description: string;
  recommendedColors: string[];
  recommendedLogoStyles: string[];
  recommendedTypography: string[];
  recommendedPersonality: string[];
  recommendedKeywords: string[];
  isActive?: boolean;
}

export type UpdateIndustryInput = Partial<CreateIndustryInput>;
