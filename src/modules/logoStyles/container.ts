import { PrismaLogoStyleCategoryRepository } from "@/modules/logoStyles/infrastructure/PrismaLogoStyleCategoryRepository";
import { PrismaLogoStyleSelectionRepository } from "@/modules/logoStyles/infrastructure/PrismaLogoStyleSelectionRepository";
import { ListLogoStyleCategoriesUseCase } from "@/modules/logoStyles/application/ListLogoStyleCategoriesUseCase";
import { RecommendLogoStyleUseCase } from "@/modules/logoStyles/application/RecommendLogoStyleUseCase";
import { SelectLogoStyleUseCase } from "@/modules/logoStyles/application/SelectLogoStyleUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { brandStrategyRepositoryInstance } from "@/modules/brandStrategies/container";

export const logoStyleCategoryRepositoryInstance = new PrismaLogoStyleCategoryRepository();
export const logoStyleSelectionRepositoryInstance = new PrismaLogoStyleSelectionRepository();

export const logoStylesContainer = {
  listLogoStyleCategoriesUseCase: new ListLogoStyleCategoriesUseCase(logoStyleCategoryRepositoryInstance),
  recommendLogoStyleUseCase: new RecommendLogoStyleUseCase(
    projectRepositoryInstance,
    brandStrategyRepositoryInstance,
    logoStyleCategoryRepositoryInstance,
  ),
  selectLogoStyleUseCase: new SelectLogoStyleUseCase(
    projectRepositoryInstance,
    logoStyleCategoryRepositoryInstance,
    logoStyleSelectionRepositoryInstance,
  ),
};
