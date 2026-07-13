import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { subscriptionsContainer } from "@/modules/subscriptions/container";

export async function GET(request: NextRequest) {
  try {
    const session = requireUser(request);
    const targetUserId = request.nextUrl.searchParams.get("userId") ?? undefined;

    const summary = await subscriptionsContainer.getUsageSummaryUseCase.execute({
      requesterId: session.sub,
      requesterRole: session.role,
      targetUserId,
    });

    return apiSuccess(summary);
  } catch (err) {
    return toApiError(err);
  }
}
