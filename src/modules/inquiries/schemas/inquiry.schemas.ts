import { z } from "zod";

export const submitInquirySchema = z.object({
  subject: z.string().min(1, "제목을 입력해주세요.").max(200),
  message: z.string().min(1, "내용을 입력해주세요.").max(5000),
  isPublic: z.boolean(),
});

export type SubmitInquiryInput = z.infer<typeof submitInquirySchema>;
