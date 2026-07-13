import { PrismaDesignMemorySettingsRepository } from "@/modules/designMemory/infrastructure/PrismaDesignMemorySettingsRepository";
import { PrismaDesignMemorySignalsRepository } from "@/modules/designMemory/infrastructure/PrismaDesignMemorySignalsRepository";
import { GetDesignMemoryUseCase } from "@/modules/designMemory/application/GetDesignMemoryUseCase";
import { UpdateDesignMemoryUseCase } from "@/modules/designMemory/application/UpdateDesignMemoryUseCase";
import { ResetDesignMemoryUseCase } from "@/modules/designMemory/application/ResetDesignMemoryUseCase";
import { UpdateDesignMemorySettingsUseCase } from "@/modules/designMemory/application/UpdateDesignMemorySettingsUseCase";
import { styleRepositoryInstance, styleFavoriteRepositoryInstance } from "@/modules/styles/container";

const settingsRepository = new PrismaDesignMemorySettingsRepository();
const signalsRepository = new PrismaDesignMemorySignalsRepository();

export const designMemoryContainer = {
  getDesignMemoryUseCase: new GetDesignMemoryUseCase(
    settingsRepository,
    signalsRepository,
    styleRepositoryInstance,
    styleFavoriteRepositoryInstance,
  ),
  updateDesignMemoryUseCase: new UpdateDesignMemoryUseCase(settingsRepository),
  resetDesignMemoryUseCase: new ResetDesignMemoryUseCase(settingsRepository),
  updateDesignMemorySettingsUseCase: new UpdateDesignMemorySettingsUseCase(settingsRepository),
};
