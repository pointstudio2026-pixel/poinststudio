import { PrismaStyleRepository } from "@/modules/styles/infrastructure/PrismaStyleRepository";
import { PrismaStyleSelectionRepository } from "@/modules/styles/infrastructure/PrismaStyleSelectionRepository";
import { PrismaStyleFavoriteRepository } from "@/modules/styles/infrastructure/PrismaStyleFavoriteRepository";
import { RecommendStylesUseCase } from "@/modules/styles/application/RecommendStylesUseCase";
import { ListStylesUseCase } from "@/modules/styles/application/ListStylesUseCase";
import { SelectStyleUseCase } from "@/modules/styles/application/SelectStyleUseCase";
import { GetStyleSelectionHistoryUseCase } from "@/modules/styles/application/GetStyleSelectionHistoryUseCase";
import { ToggleStyleFavoriteUseCase } from "@/modules/styles/application/ToggleStyleFavoriteUseCase";
import { ListFavoriteStylesUseCase } from "@/modules/styles/application/ListFavoriteStylesUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { brandStrategyRepositoryInstance } from "@/modules/brandStrategies/container";

const styleRepository = new PrismaStyleRepository();
const styleSelectionRepository = new PrismaStyleSelectionRepository();
const styleFavoriteRepository = new PrismaStyleFavoriteRepository();

export const stylesContainer = {
  recommendStylesUseCase: new RecommendStylesUseCase(
    projectRepositoryInstance,
    brandStrategyRepositoryInstance,
    styleRepository,
  ),
  listStylesUseCase: new ListStylesUseCase(styleRepository),
  selectStyleUseCase: new SelectStyleUseCase(
    projectRepositoryInstance,
    styleRepository,
    styleSelectionRepository,
  ),
  getStyleSelectionHistoryUseCase: new GetStyleSelectionHistoryUseCase(
    projectRepositoryInstance,
    styleSelectionRepository,
  ),
  toggleStyleFavoriteUseCase: new ToggleStyleFavoriteUseCase(styleRepository, styleFavoriteRepository),
  listFavoriteStylesUseCase: new ListFavoriteStylesUseCase(styleFavoriteRepository),
};
