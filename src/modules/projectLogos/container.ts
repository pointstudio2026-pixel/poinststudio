import { PrismaProjectLogoAssetRepository } from "@/modules/projectLogos/infrastructure/PrismaProjectLogoAssetRepository";
import { AddProjectLogoUseCase } from "@/modules/projectLogos/application/AddProjectLogoUseCase";
import { GetProjectLogoImageUseCase } from "@/modules/projectLogos/application/GetProjectLogoImageUseCase";
import { SelectLogoChoiceUseCase } from "@/modules/projectLogos/application/SelectLogoChoiceUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { resolveFileStorage } from "@/shared/storage/fileStorageRouter";

export const projectLogoAssetRepositoryInstance = new PrismaProjectLogoAssetRepository();
const fileStorage = resolveFileStorage();

export const projectLogosContainer = {
  addProjectLogoUseCase: new AddProjectLogoUseCase(
    projectRepositoryInstance,
    projectLogoAssetRepositoryInstance,
    fileStorage,
  ),
  getProjectLogoImageUseCase: new GetProjectLogoImageUseCase(
    projectRepositoryInstance,
    projectLogoAssetRepositoryInstance,
    fileStorage,
  ),
  selectLogoChoiceUseCase: new SelectLogoChoiceUseCase(
    projectRepositoryInstance,
    projectLogoAssetRepositoryInstance,
    fileStorage,
  ),
};

export { fileStorage as projectLogosFileStorage };
