import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { stylesContainer } from "@/modules/styles/container";

export async function GET(request: NextRequest) {
  try {
    const session = requireUser(request);
    const styles = await stylesContainer.listFavoriteStylesUseCase.execute({ userId: session.sub });
    return apiSuccess({ styles });
  } catch (err) {
    return toApiError(err);
  }
}
