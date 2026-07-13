import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { exportsContainer } from "@/modules/exports/container";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { projectId } = await params;
    const exportsList = await exportsContainer.getExportsUseCase.execute({ projectId, userId: session.sub });
    return apiSuccess({ exports: exportsList });
  } catch (err) {
    return toApiError(err);
  }
}
