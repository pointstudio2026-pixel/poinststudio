import { PrismaBrandBriefRepository } from "@/modules/brandBriefs/infrastructure/PrismaBrandBriefRepository";
import { BrandBriefComposer } from "@/modules/brandBriefs/application/BrandBriefComposer";
import { GenerateBrandBriefUseCase } from "@/modules/brandBriefs/application/GenerateBrandBriefUseCase";
import { GetBrandBriefUseCase } from "@/modules/brandBriefs/application/GetBrandBriefUseCase";
import { UpdateBrandBriefUseCase } from "@/modules/brandBriefs/application/UpdateBrandBriefUseCase";
import { RestoreBrandBriefVersionUseCase } from "@/modules/brandBriefs/application/RestoreBrandBriefVersionUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { interviewRepositoryInstance } from "@/modules/interviews/container";
import { resolveTextCompletionProvider } from "@/shared/ai/textCompletionRouter";

export const brandBriefRepositoryInstance = new PrismaBrandBriefRepository();
const brandBriefRepository = brandBriefRepositoryInstance;
const composer = new BrandBriefComposer(resolveTextCompletionProvider());

export const brandBriefsContainer = {
  generateBrandBriefUseCase: new GenerateBrandBriefUseCase(
    projectRepositoryInstance,
    interviewRepositoryInstance,
    brandBriefRepository,
    composer,
  ),
  getBrandBriefUseCase: new GetBrandBriefUseCase(projectRepositoryInstance, brandBriefRepository),
  updateBrandBriefUseCase: new UpdateBrandBriefUseCase(
    projectRepositoryInstance,
    brandBriefRepository,
  ),
  restoreBrandBriefVersionUseCase: new RestoreBrandBriefVersionUseCase(
    projectRepositoryInstance,
    brandBriefRepository,
  ),
};
