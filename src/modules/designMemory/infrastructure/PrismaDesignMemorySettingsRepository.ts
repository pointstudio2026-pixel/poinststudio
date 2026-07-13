import { prisma } from "@/shared/database/prisma";
import type { DesignMemorySettings } from "@/modules/designMemory/domain/DesignMemory";
import type { DesignMemorySettingsRepository } from "@/modules/designMemory/domain/DesignMemorySettingsRepository";

function toSettings(row: { userId: string; enabled: boolean; resetAt: Date | null }): DesignMemorySettings {
  return { userId: row.userId, enabled: row.enabled, resetAt: row.resetAt };
}

export class PrismaDesignMemorySettingsRepository implements DesignMemorySettingsRepository {
  async findByUserId(userId: string): Promise<DesignMemorySettings | null> {
    const row = await prisma.designMemorySettings.findUnique({ where: { userId } });
    return row ? toSettings(row) : null;
  }

  async createDefault(userId: string): Promise<DesignMemorySettings> {
    try {
      const row = await prisma.designMemorySettings.create({ data: { userId } });
      return toSettings(row);
    } catch (err) {
      // Lost a create race (unique[userId]) -- someone else just provisioned it, re-fetch.
      const existing = await this.findByUserId(userId);
      if (existing) return existing;
      throw err;
    }
  }

  async setEnabled(userId: string, enabled: boolean): Promise<DesignMemorySettings> {
    const row = await prisma.designMemorySettings.update({ where: { userId }, data: { enabled } });
    return toSettings(row);
  }

  async resetNow(userId: string): Promise<DesignMemorySettings> {
    const row = await prisma.designMemorySettings.update({ where: { userId }, data: { resetAt: new Date() } });
    return toSettings(row);
  }
}
