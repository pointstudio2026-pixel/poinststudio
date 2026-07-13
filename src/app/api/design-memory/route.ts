import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { designMemoryContainer } from "@/modules/designMemory/container";

export async function GET(request: NextRequest) {
  try {
    const session = requireUser(request);
    const profile = await designMemoryContainer.getDesignMemoryUseCase.execute({ userId: session.sub });
    return apiSuccess({ profile });
  } catch (err) {
    return toApiError(err);
  }
}
