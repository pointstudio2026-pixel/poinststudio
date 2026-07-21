import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdminTier } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { changeUserRoleSchema } from "@/modules/admin/schemas/admin.schemas";
import { adminContainer } from "@/modules/admin/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireAdminTier(request, ["super_admin"]);
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = changeUserRoleSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    await adminContainer.changeUserRoleUseCase.execute({
      targetUserId: id,
      actingUserId: session.sub,
      ...parsed.data,
    });

    return apiSuccess({ ok: true });
  } catch (err) {
    return toApiError(err);
  }
}
