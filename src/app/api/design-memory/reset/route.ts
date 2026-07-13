import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { designMemoryContainer } from "@/modules/designMemory/container";

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const settings = await designMemoryContainer.resetDesignMemoryUseCase.execute({ userId: session.sub });
    return apiSuccess({ settings });
  } catch (err) {
    return toApiError(err);
  }
}
