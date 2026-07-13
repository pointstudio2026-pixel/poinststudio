import type { SystemAnnouncement } from "@/modules/admin/domain/Admin";

export interface AnnouncementRepository {
  create(message: string, createdBy: string): Promise<SystemAnnouncement>;
  listActive(): Promise<SystemAnnouncement[]>;
  deactivate(id: string): Promise<SystemAnnouncement>;
}
