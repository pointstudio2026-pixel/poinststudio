import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { setAuthCookies } from "@/shared/auth/cookies";
import { ValidationError } from "@/shared/errors/AppError";
import { loginSchema } from "@/modules/auth/schemas/auth.schemas";
import { authContainer } from "@/modules/auth/container";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const result = await authContainer.loginUseCase.execute(parsed.data);

    const res = apiSuccess({ user: result.user });
    setAuthCookies(res, result);
    return res;
  } catch (err) {
    return toApiError(err);
  }
}
