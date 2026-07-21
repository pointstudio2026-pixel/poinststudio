import { PrismaConceptBoardRepository } from "@/modules/conceptBoards/infrastructure/PrismaConceptBoardRepository";
import { BuildConceptBoardUseCase } from "@/modules/conceptBoards/application/BuildConceptBoardUseCase";
import { GetConceptBoardUseCase } from "@/modules/conceptBoards/application/GetConceptBoardUseCase";
import { UpdateConceptBoardUseCase } from "@/modules/conceptBoards/application/UpdateConceptBoardUseCase";
import { RestoreConceptBoardVersionUseCase } from "@/modules/conceptBoards/application/RestoreConceptBoardVersionUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { interviewRepositoryInstance } from "@/modules/interviews/container";
import { brandStrategyRepositoryInstance } from "@/modules/brandStrategies/container";
import { styleRepositoryInstance, styleSelectionRepositoryInstance } from "@/modules/styles/container";
import { generationRepositoryInstance } from "@/modules/generations/container";
import { colorPaletteSelectionRepositoryInstance } from "@/modules/colorPalettes/container";

export const conceptBoardRepositoryInstance = new PrismaConceptBoardRepository();
const conceptBoardRepository = conceptBoardRepositoryInstance;

export const conceptBoardsContainer = {
  buildConceptBoardUseCase: new BuildConceptBoardUseCase(
    projectRepositoryInstance,
    interviewRepositoryInstance,
    brandStrategyRepositoryInstance,
    styleRepositoryInstance,
    styleSelectionRepositoryInstance,
    generationRepositoryInstance,
    colorPaletteSelectionRepositoryInstance,
    conceptBoardRepository,
  ),
  getConceptBoardUseCase: new GetConceptBoardUseCase(projectRepositoryInstance, conceptBoardRepository),
  updateConceptBoardUseCase: new UpdateConceptBoardUseCase(projectRepositoryInstance, conceptBoardRepository),
  restoreConceptBoardVersionUseCase: new RestoreConceptBoardVersionUseCase(
    projectRepositoryInstance,
    conceptBoardRepository,
  ),
};
