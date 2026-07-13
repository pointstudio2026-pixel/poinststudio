import { z } from "zod";

export const saveAnswerSchema = z.object({
  questionKey: z.string().min(1),
  answer: z.string().max(4000, "답변은 4000자 이하여야 합니다."),
});

export type SaveAnswerBody = z.infer<typeof saveAnswerSchema>;
