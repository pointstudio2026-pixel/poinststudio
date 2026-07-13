import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { exportsContainer } from "@/modules/exports/container";

interface RouteParams {
  params: Promise<{ exportId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { exportId } = await params;
    const job = await exportsContainer.getExportStatusUseCase.execute({ exportId, userId: session.sub });
    return apiSuccess({ export: job });
  } catch (err) {
    return toApiError(err);
  }
}
