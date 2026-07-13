import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { mockupsContainer } from "@/modules/mockups/container";
import type { MockupCategory } from "@/modules/mockups/domain/Mockup";

export async function GET(request: NextRequest) {
  try {
    requireUser(request);
    const category = new URL(request.url).searchParams.get("category") as MockupCategory | null;
    const result = await mockupsContainer.getMockupTemplatesUseCase.execute({ category: category ?? undefined });
    return apiSuccess(result);
  } catch (err) {
    return toApiError(err);
  }
}
