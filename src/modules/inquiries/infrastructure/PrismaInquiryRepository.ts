import { prisma } from "@/shared/database/prisma";
import type {
  CreateInquiryInput,
  InquiryRepository,
} from "@/modules/inquiries/domain/InquiryRepository";
import type { Inquiry } from "@/modules/inquiries/domain/Inquiry";

export class PrismaInquiryRepository implements InquiryRepository {
  async create(input: CreateInquiryInput): Promise<Inquiry> {
    return prisma.inquiry.create({
      data: {
        userId: input.userId,
        subject: input.subject,
        message: input.message,
        isPublic: input.isPublic,
        locale: input.locale,
      },
    });
  }

  async getById(id: string): Promise<Inquiry | null> {
    return prisma.inquiry.findUnique({ where: { id } });
  }

  async listAll(locale?: string): Promise<Inquiry[]> {
    return prisma.inquiry.findMany({
      where: locale ? { locale } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }
}
