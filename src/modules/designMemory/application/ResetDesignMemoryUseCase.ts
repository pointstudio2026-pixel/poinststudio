import type { DesignMemorySettingsRepository } from "@/modules/designMemory/domain/DesignMemorySettingsRepository";
import type { DesignMemorySettings } from "@/modules/designMemory/domain/DesignMemory";
import { recordActivity } from "@/shared/activity/activityLogger";

export class ResetDesignMemoryUseCase {
  constructor(private readonly settingsRepository: DesignMemorySettingsRepository) {}

  async execute(input: { userId: string }): Promise<DesignMemorySettings> {
    const existing = await this.settingsRepository.findByUserId(input.userId);
    if (!existing) {
      await this.settingsRepository.createDefault(input.userId);
    }
    const settings = await this.settingsRepository.resetNow(input.userId);

    await recordActivity({
      userId: input.userId,
      eventType: "DESIGN_MEMORY_RESET",
      payload: {},
    });

    return settings;
  }
}
