import { PrismaBrandStrategyRepository } from "@/modules/brandStrategies/infrastructure/PrismaBrandStrategyRepository";
import { AsterBrainComposer } from "@/modules/brandStrategies/application/AsterBrainComposer";
import { ExecuteAsterBrainUseCase } from "@/modules/brandStrategies/application/ExecuteAsterBrainUseCase";
import { GetBrandStrategyUseCase } from "@/modules/brandStrategies/application/GetBrandStrategyUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { interviewRepositoryInstance } from "@/modules/interviews/container";
import { brandBriefRepositoryInstance } from "@/modules/brandBriefs/container";
import { resolveTextCompletionProvider } from "@/shared/ai/textCompletionRouter";

export const brandStrategyRepositoryInstance = new PrismaBrandStrategyRepository();
const composer = new AsterBrainComposer(resolveTextCompletionProvider());

export const brandStrategiesContainer = {
  executeAsterBrainUseCase: new ExecuteAsterBrainUseCase(
    projectRepositoryInstance,
    interviewRepositoryInstance,
    brandBriefRepositoryInstance,
    brandStrategyRepositoryInstance,
    composer,
  ),
  getBrandStrategyUseCase: new GetBrandStrategyUseCase(
    projectRepositoryInstance,
    brandStrategyRepositoryInstance,
  ),
};
