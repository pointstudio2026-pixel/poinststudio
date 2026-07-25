import { z } from "zod";

export const redeemGiftCodeSchema = z.object({
  code: z.string().trim().min(1, "코드를 입력해주세요."),
});

export type RedeemGiftCodeInput = z.infer<typeof redeemGiftCodeSchema>;
