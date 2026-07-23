import { PrismaBrandStrategyRepository } from "@/modules/brandStrategies/infrastructure/PrismaBrandStrategyRepository";
import { AsterBrainComposer } from "@/modules/brandStrategies/application/AsterBrainComposer";
import { ExecuteAsterBrainUseCase } from "@/modules/brandStrategies/application/ExecuteAsterBrainUseCase";
import { SelectBrandStrategyUseCase } from "@/modules/brandStrategies/application/SelectBrandStrategyUseCase";
import { GetBrandStrategyUseCase } from "@/modules/brandStrategies/application/GetBrandStrategyUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { interviewRepositoryInstance } from "@/modules/interviews/container";
import { styleRepositoryInstance, styleSelectionRepositoryInstance } from "@/modules/styles/container";
import { colorPaletteSelectionRepositoryInstance } from "@/modules/colorPalettes/container";

export const brandStrategyRepositoryInstance = new PrismaBrandStrategyRepository();
const composer = new AsterBrainComposer();

export const brandStrategiesContainer = {
  executeAsterBrainUseCase: new ExecuteAsterBrainUseCase(
    projectRepositoryInstance,
    interviewRepositoryInstance,
    styleSelectionRepositoryInstance,
    brandStrategyRepositoryInstance,
    composer,
    colorPaletteSelectionRepositoryInstance,
    styleRepositoryInstance,
  ),
  selectBrandStrategyUseCase: new SelectBrandStrategyUseCase(
    projectRepositoryInstance,
    brandStrategyRepositoryInstance,
  ),
  getBrandStrategyUseCase: new GetBrandStrategyUseCase(
    projectRepositoryInstance,
    brandStrategyRepositoryInstance,
  ),
};
