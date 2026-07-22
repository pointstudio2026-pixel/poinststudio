import type {
  CreateInquiryInput,
  InquiryRepository,
} from "@/modules/inquiries/domain/InquiryRepository";
import type { Inquiry } from "@/modules/inquiries/domain/Inquiry";

export class FakeInquiryRepository implements InquiryRepository {
  inquiries: Inquiry[] = [];

  async create(input: CreateInquiryInput): Promise<Inquiry> {
    const inquiry: Inquiry = {
      id: `inquiry-${this.inquiries.length + 1}`,
      userId: input.userId,
      subject: input.subject,
      message: input.message,
      isPublic: input.isPublic,
      locale: input.locale,
      createdAt: new Date(),
    };
    this.inquiries.push(inquiry);
    return inquiry;
  }

  async getById(id: string): Promise<Inquiry | null> {
    return this.inquiries.find((i) => i.id === id) ?? null;
  }

  async listAll(locale?: string): Promise<Inquiry[]> {
    return [...this.inquiries]
      .filter((i) => !locale || i.locale === locale)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
