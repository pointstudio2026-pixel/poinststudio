import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { editsContainer } from "@/modules/edits/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** :id here is a generationId -- returns that generation's edit history. */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id: generationId } = await params;
    const history = await editsContainer.getEditHistoryUseCase.execute({
      generationId,
      userId: session.sub,
    });
    return apiSuccess({ history });
  } catch (err) {
    return toApiError(err);
  }
}
