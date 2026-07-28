import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { mockupsContainer } from "@/modules/mockups/container";

export async function GET(request: NextRequest) {
  try {
    const session = requireUser(request);
    const images = await mockupsContainer.listPastGenerationImagesUseCase.execute({ userId: session.sub });
    return apiSuccess({ images });
  } catch (err) {
    return toApiError(err);
  }
}
