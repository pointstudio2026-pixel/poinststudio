import type { AnnouncementRepository } from "@/modules/admin/domain/AnnouncementRepository";
import type { SystemAnnouncement } from "@/modules/admin/domain/Admin";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

export class CreateAnnouncementUseCase {
  constructor(private readonly announcementRepository: AnnouncementRepository) {}

  async execute(input: { adminUserId: string; message: string }): Promise<SystemAnnouncement> {
    if (!input.message.trim()) {
      throw new ValidationError("공지 내용을 입력해주세요.");
    }
    const announcement = await this.announcementRepository.create(input.message.trim(), input.adminUserId);

    await recordActivity({
      userId: input.adminUserId,
      eventType: "ADMIN_ANNOUNCEMENT_CREATED",
      payload: { announcementId: announcement.id },
    });

    return announcement;
  }
}

export class ListAnnouncementsUseCase {
  constructor(private readonly announcementRepository: AnnouncementRepository) {}

  async execute(): Promise<SystemAnnouncement[]> {
    return this.announcementRepository.listActive();
  }
}

export class DeactivateAnnouncementUseCase {
  constructor(private readonly announcementRepository: AnnouncementRepository) {}

  async execute(input: { adminUserId: string; announcementId: string }): Promise<SystemAnnouncement> {
    const active = await this.announcementRepository.listActive();
    if (!active.some((a) => a.id === input.announcementId)) {
      throw new NotFoundError("공지를 찾을 수 없습니다.", "ANNOUNCEMENT_NOT_FOUND");
    }
    const announcement = await this.announcementRepository.deactivate(input.announcementId);

    await recordActivity({
      userId: input.adminUserId,
      eventType: "ADMIN_ANNOUNCEMENT_DEACTIVATED",
      payload: { announcementId: input.announcementId },
    });

    return announcement;
  }
}
