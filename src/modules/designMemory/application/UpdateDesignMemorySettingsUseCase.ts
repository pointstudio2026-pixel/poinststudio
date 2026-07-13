import type { DesignMemorySettingsRepository } from "@/modules/designMemory/domain/DesignMemorySettingsRepository";
import type { DesignMemorySettings } from "@/modules/designMemory/domain/DesignMemory";
import { recordActivity } from "@/shared/activity/activityLogger";

export class UpdateDesignMemorySettingsUseCase {
  constructor(private readonly settingsRepository: DesignMemorySettingsRepository) {}

  async execute(input: { userId: string; enabled: boolean }): Promise<DesignMemorySettings> {
    const existing = await this.settingsRepository.findByUserId(input.userId);
    if (!existing) {
      await this.settingsRepository.createDefault(input.userId);
    }
    const settings = await this.settingsRepository.setEnabled(input.userId, input.enabled);

    await recordActivity({
      userId: input.userId,
      eventType: input.enabled ? "DESIGN_MEMORY_ENABLED" : "DESIGN_MEMORY_DISABLED",
      payload: {},
    });

    return settings;
  }
}
