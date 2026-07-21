import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { subscriptionsContainer } from "@/modules/subscriptions/container";

const checkPlanSchema = z.object({
  eventType: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = checkPlanSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const result = await subscriptionsContainer.checkPlanUseCase.execute({
      userId: session.sub,
      eventType: parsed.data.eventType,
      userRole: session.role,
    });

    return apiSuccess(result);
  } catch (err) {
    return toApiError(err);
  }
}
