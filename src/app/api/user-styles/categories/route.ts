import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { userStylesContainer } from "@/modules/userStyles/container";

const bodySchema = z.object({ name: z.string().min(1).max(100) });

export async function GET(request: NextRequest) {
  try {
    const session = requireUser(request);
    const categories = await userStylesContainer.listUserStyleCategoriesUseCase.execute({ userId: session.sub });
    return apiSuccess({ categories });
  } catch (err) {
    return toApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const category = await userStylesContainer.createUserStyleCategoryUseCase.execute({
      userId: session.sub,
      name: parsed.data.name,
    });

    return apiSuccess({ category }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
