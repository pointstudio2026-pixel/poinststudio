import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { logoStylesContainer } from "@/modules/logoStyles/container";

export async function GET(request: NextRequest) {
  try {
    requireUser(request);
    const categories = await logoStylesContainer.listLogoStyleCategoriesUseCase.execute();
    return apiSuccess({ categories });
  } catch (err) {
    return toApiError(err);
  }
}
