import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdmin } from "@/shared/auth/session";
import { promptPriorityContainer } from "@/modules/promptPriority/container";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const records = await promptPriorityContainer.listPromptDecisionRecordsUseCase.execute();
    return apiSuccess({ records });
  } catch (err) {
    return toApiError(err);
  }
}
