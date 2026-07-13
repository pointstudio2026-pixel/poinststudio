import type { DesignMemorySettings } from "@/modules/designMemory/domain/DesignMemory";

export interface DesignMemorySettingsRepository {
  findByUserId(userId: string): Promise<DesignMemorySettings | null>;
  /** Lazily provisions a default (enabled, no reset) row -- mirrors SubscriptionRepository.createDefault. */
  createDefault(userId: string): Promise<DesignMemorySettings>;
  setEnabled(userId: string, enabled: boolean): Promise<DesignMemorySettings>;
  resetNow(userId: string): Promise<DesignMemorySettings>;
}
