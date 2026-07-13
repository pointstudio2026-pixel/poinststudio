import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdmin } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { adminContainer } from "@/modules/admin/container";

const bodySchema = z.object({ message: z.string().min(1) });

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const announcements = await adminContainer.listAnnouncementsUseCase.execute();
    return apiSuccess({ announcements });
  } catch (err) {
    return toApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const announcement = await adminContainer.createAnnouncementUseCase.execute({
      adminUserId: session.sub,
      message: parsed.data.message,
    });

    return apiSuccess({ announcement }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
