export interface Industry {
  id: string;
  name: string;
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
