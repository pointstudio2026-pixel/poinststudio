import { PrismaInquiryRepository } from "@/modules/inquiries/infrastructure/PrismaInquiryRepository";
import { SubmitInquiryUseCase } from "@/modules/inquiries/application/SubmitInquiryUseCase";
import { ListInquiriesUseCase } from "@/modules/inquiries/application/ListInquiriesUseCase";
import { GetInquiryUseCase } from "@/modules/inquiries/application/GetInquiryUseCase";

const inquiryRepository = new PrismaInquiryRepository();

export const inquiriesContainer = {
  submitInquiryUseCase: new SubmitInquiryUseCase(inquiryRepository),
  listInquiriesUseCase: new ListInquiriesUseCase(inquiryRepository),
  getInquiryUseCase: new GetInquiryUseCase(inquiryRepository),
};
