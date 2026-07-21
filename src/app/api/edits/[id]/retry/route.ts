import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { editsContainer } from "@/modules/edits/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** :id here is an editHistoryId -- the specific failed edit being retried. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id: editHistoryId } = await params;
    const edit = await editsContainer.retryEditUseCase.execute({
      editHistoryId,
      userId: session.sub,
      userRole: session.role,
    });
    return apiSuccess({ edit }, { status: 202 });
  } catch (err) {
    return toApiError(err);
  }
}
