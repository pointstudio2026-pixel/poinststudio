import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { inquiriesContainer } from "@/modules/inquiries/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id } = await params;
    const inquiry = await inquiriesContainer.getInquiryUseCase.execute({
      inquiryId: id,
      userId: session.sub,
      userRole: session.role,
    });
    return apiSuccess({ inquiry });
  } catch (err) {
    return toApiError(err);
  }
}
