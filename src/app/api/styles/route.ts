import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { stylesContainer } from "@/modules/styles/container";

export async function GET(request: NextRequest) {
  try {
    requireUser(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const levelParam = searchParams.get("level");
    const level = levelParam ? Number(levelParam) : undefined;

    const result = await stylesContainer.listStylesUseCase.execute({ category, search, level });
    return apiSuccess(result);
  } catch (err) {
    return toApiError(err);
  }
}
