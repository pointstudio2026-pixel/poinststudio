import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { userStylesContainer } from "@/modules/userStyles/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id } = await params;
    await userStylesContainer.deleteUserStyleCategoryUseCase.execute({ userId: session.sub, categoryId: id });
    return apiSuccess({ deleted: true });
  } catch (err) {
    return toApiError(err);
  }
}
