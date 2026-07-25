import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdminTier } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { generateGiftCodesSchema } from "@/modules/admin/schemas/admin.schemas";
import { adminContainer } from "@/modules/admin/container";

export async function POST(request: NextRequest) {
  try {
    const session = requireAdminTier(request, ["super_admin"]);
    const body = await request.json().catch(() => null);
    const parsed = generateGiftCodesSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const codes = await adminContainer.generateGiftCodesUseCase.execute({
      adminUserId: session.sub,
      planCode: parsed.data.planCode,
      grantDays: parsed.data.grantDays,
      count: parsed.data.count,
      batchLabel: parsed.data.batchLabel ?? null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    });

    return apiSuccess({ codes });
  } catch (err) {
    return toApiError(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    requireAdminTier(request, ["super_admin"]);
    const batchLabel = request.nextUrl.searchParams.get("batchLabel") ?? undefined;

    const codes = await adminContainer.listGiftCodesUseCase.execute({ batchLabel });

    return apiSuccess({ codes });
  } catch (err) {
    return toApiError(err);
  }
}
