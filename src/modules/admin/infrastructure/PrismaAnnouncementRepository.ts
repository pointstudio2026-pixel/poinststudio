import { prisma } from "@/shared/database/prisma";
import type { SystemAnnouncement } from "@/modules/admin/domain/Admin";
import type { AnnouncementRepository } from "@/modules/admin/domain/AnnouncementRepository";

export class PrismaAnnouncementRepository implements AnnouncementRepository {
  async create(message: string, createdBy: string): Promise<SystemAnnouncement> {
    return prisma.systemAnnouncement.create({ data: { message, createdBy } });
  }

  async listActive(): Promise<SystemAnnouncement[]> {
    return prisma.systemAnnouncement.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async deactivate(id: string): Promise<SystemAnnouncement> {
    return prisma.systemAnnouncement.update({
      where: { id },
      data: { active: false, deactivatedAt: new Date() },
    });
  }
}
