import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { designMemoryContainer } from "@/modules/designMemory/container";

const bodySchema = z.object({ projectId: z.string().min(1).optional() });

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body ?? {});
    const settings = await designMemoryContainer.updateDesignMemoryUseCase.execute({
      userId: session.sub,
      projectId: parsed.success ? parsed.data.projectId : undefined,
    });
    return apiSuccess({ settings });
  } catch (err) {
    return toApiError(err);
  }
}
