import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { updateConceptBoardSchema } from "@/modules/conceptBoards/schemas/conceptBoard.schemas";
import { conceptBoardsContainer } from "@/modules/conceptBoards/container";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { projectId } = await params;
    const result = await conceptBoardsContainer.getConceptBoardUseCase.execute({
      projectId,
      userId: session.sub,
    });
    return apiSuccess(result);
  } catch (err) {
    return toApiError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { projectId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updateConceptBoardSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const board = await conceptBoardsContainer.updateConceptBoardUseCase.execute({
      projectId,
      userId: session.sub,
      patch: parsed.data,
    });

    return apiSuccess({ board });
  } catch (err) {
    return toApiError(err);
  }
}
