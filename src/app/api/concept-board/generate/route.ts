import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { conceptBoardsContainer } from "@/modules/conceptBoards/container";
import { LOCALE_COOKIE, parseLocaleCookie } from "@/shared/i18n/cookie";

const bodySchema = z.object({ projectId: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const board = await conceptBoardsContainer.buildConceptBoardUseCase.execute({
      projectId: parsed.data.projectId,
      userId: session.sub,
      locale: parseLocaleCookie(request.cookies.get(LOCALE_COOKIE)?.value),
    });

    return apiSuccess({ board }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
