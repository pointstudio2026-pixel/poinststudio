import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { restoreConceptBoardVersionSchema } from "@/modules/conceptBoards/schemas/conceptBoard.schemas";
import { conceptBoardsContainer } from "@/modules/conceptBoards/container";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { projectId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = restoreConceptBoardVersionSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const board = await conceptBoardsContainer.restoreConceptBoardVersionUseCase.execute({
      projectId,
      userId: session.sub,
      versionNumber: parsed.data.versionNumber,
    });

    return apiSuccess({ board });
  } catch (err) {
    return toApiError(err);
  }
}
