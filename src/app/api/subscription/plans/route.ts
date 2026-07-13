import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { subscriptionsContainer } from "@/modules/subscriptions/container";

export function GET(request: NextRequest) {
  try {
    requireUser(request);
    const plans = subscriptionsContainer.getPlansUseCase.execute();
    return apiSuccess({ plans });
  } catch (err) {
    return toApiError(err);
  }
}
