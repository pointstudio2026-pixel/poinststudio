import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { subscriptionsContainer } from "@/modules/subscriptions/container";

export async function GET(request: NextRequest) {
  try {
    const session = requireUser(request);
    const subscription = await subscriptionsContainer.getSubscriptionUseCase.execute({
      userId: session.sub,
    });
    return apiSuccess({ subscription });
  } catch (err) {
    return toApiError(err);
  }
}
