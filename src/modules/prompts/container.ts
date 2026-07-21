import { PrismaPromptRepository } from "@/modules/prompts/infrastructure/PrismaPromptRepository";
import { BuildPromptUseCase } from "@/modules/prompts/application/BuildPromptUseCase";
import { GetPromptUseCase } from "@/modules/prompts/application/GetPromptUseCase";
import { GetPromptVersionsUseCase } from "@/modules/prompts/application/GetPromptVersionsUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { interviewRepositoryInstance } from "@/modules/interviews/container";
import { brandStrategyRepositoryInstance } from "@/modules/brandStrategies/container";
import { styleRepositoryInstance, styleSelectionRepositoryInstance } from "@/modules/styles/container";
import {
  logoStyleCategoryRepositoryInstance,
  logoStyleSelectionRepositoryInstance,
} from "@/modules/logoStyles/container";
import {
  userStyleCategoryRepositoryInstance,
  projectUserStyleSelectionRepositoryInstance,
} from "@/modules/userStyles/container";
import { colorPaletteSelectionRepositoryInstance } from "@/modules/colorPalettes/container";

export const promptRepositoryInstance = new PrismaPromptRepository();
const promptRepository = promptRepositoryInstance;
const styleRepository = styleRepositoryInstance;
const styleSelectionRepository = styleSelectionRepositoryInstance;

export const promptsContainer = {
  buildPromptUseCase: new BuildPromptUseCase(
    projectRepositoryInstance,
    interviewRepositoryInstance,
    brandStrategyRepositoryInstance,
    styleRepository,
    styleSelectionRepository,
    logoStyleCategoryRepositoryInstance,
    logoStyleSelectionRepositoryInstance,
    userStyleCategoryRepositoryInstance,
    projectUserStyleSelectionRepositoryInstance,
    colorPaletteSelectionRepositoryInstance,
    promptRepository,
  ),
  getPromptUseCase: new GetPromptUseCase(projectRepositoryInstance, promptRepository),
  getPromptVersionsUseCase: new GetPromptVersionsUseCase(projectRepositoryInstance, promptRepository),
};
