import type { InquiryRepository } from "@/modules/inquiries/domain/InquiryRepository";
import type { Inquiry } from "@/modules/inquiries/domain/Inquiry";
import type { SubmitInquiryInput } from "@/modules/inquiries/schemas/inquiry.schemas";
import { recordActivity } from "@/shared/activity/activityLogger";
import { sendN8nAlert } from "@/shared/monitoring/n8nAlert";

export class SubmitInquiryUseCase {
  constructor(private readonly inquiryRepository: InquiryRepository) {}

  async execute(input: { userId: string; locale: string } & SubmitInquiryInput): Promise<Inquiry> {
    const inquiry = await this.inquiryRepository.create({
      userId: input.userId,
      subject: input.subject.trim(),
      message: input.message.trim(),
      isPublic: input.isPublic,
      locale: input.locale,
    });

    await recordActivity({
      userId: input.userId,
      eventType: "INQUIRY_SUBMITTED",
      payload: { inquiryId: inquiry.id },
    });

    sendN8nAlert(process.env.N8N_INQUIRY_WEBHOOK_URL, {
      inquiryId: inquiry.id,
      userId: input.userId,
      subject: inquiry.subject,
      message: inquiry.message,
    });

    return inquiry;
  }
}
