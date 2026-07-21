import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { userStylesContainer } from "@/modules/userStyles/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id } = await params;
    const category = await userStylesContainer.reanalyzeUserStyleCategoryUseCase.execute({
      userId: session.sub,
      categoryId: id,
    });
    return apiSuccess({ category });
  } catch (err) {
    return toApiError(err);
  }
}
