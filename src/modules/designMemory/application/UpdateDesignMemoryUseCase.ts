import type { DesignMemorySettingsRepository } from "@/modules/designMemory/domain/DesignMemorySettingsRepository";
import type { DesignMemorySettings } from "@/modules/designMemory/domain/DesignMemory";
import { recordActivity } from "@/shared/activity/activityLogger";

/**
 * "프로젝트 완료 시 선호도 갱신": recommendations are always computed live
 * from the real signal tables (StyleSelection/EditHistory/etc.), so there
 * is no separate snapshot to recompute here -- calling this just ensures
 * a settings row exists (so a brand-new user shows up in the "선호도
 * 저장" sense) and logs the checkpoint. If the user has disabled Design
 * Memory, this still records the event but GetDesignMemoryUseCase will
 * keep returning an empty profile regardless (읽기 시점에 강제).
 */
export class UpdateDesignMemoryUseCase {
  constructor(private readonly settingsRepository: DesignMemorySettingsRepository) {}

  async execute(input: { userId: string; projectId?: string }): Promise<DesignMemorySettings> {
    const settings =
      (await this.settingsRepository.findByUserId(input.userId)) ??
      (await this.settingsRepository.createDefault(input.userId));

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "DESIGN_MEMORY_UPDATED",
      payload: {},
    });

    return settings;
  }
}
