import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { selectColorPaletteSchema } from "@/modules/colorPalettes/schemas/colorPalette.schemas";
import { colorPalettesContainer } from "@/modules/colorPalettes/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = selectColorPaletteSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const selection = await colorPalettesContainer.selectColorPaletteUseCase.execute({
      projectId: id,
      userId: session.sub,
      ...parsed.data,
    });

    return apiSuccess({ selection }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
