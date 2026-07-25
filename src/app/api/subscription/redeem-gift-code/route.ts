import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { redeemGiftCodeSchema } from "@/modules/giftCodes/schemas/giftCode.schemas";
import { giftCodesContainer } from "@/modules/giftCodes/container";

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = redeemGiftCodeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const subscription = await giftCodesContainer.redeemGiftCodeUseCase.execute({
      userId: session.sub,
      code: parsed.data.code,
    });

    return apiSuccess({ subscription });
  } catch (err) {
    return toApiError(err);
  }
}
