import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { teamsContainer } from "@/modules/teams/container";

const joinTeamSchema = z.object({
  code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = joinTeamSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const membership = await teamsContainer.joinTeamUseCase.execute({
      userId: session.sub,
      code: parsed.data.code,
    });

    return apiSuccess({ membership }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
