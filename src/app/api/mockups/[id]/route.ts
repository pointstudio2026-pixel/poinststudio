import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { mockupsContainer } from "@/modules/mockups/container";
import type { MockupCategory } from "@/modules/mockups/domain/Mockup";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** :id here is a projectId -- returns that project's mockups, optionally filtered by category. */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id: projectId } = await params;
    const category = new URL(request.url).searchParams.get("category") as MockupCategory | null;
    const mockups = await mockupsContainer.getMockupsUseCase.execute({
      projectId,
      userId: session.sub,
      category: category ?? undefined,
    });
    return apiSuccess({ mockups });
  } catch (err) {
    return toApiError(err);
  }
}

/** :id here is a mockupId. */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id: mockupId } = await params;
    await mockupsContainer.deleteMockupUseCase.execute({ mockupId, userId: session.sub });
    return apiSuccess({ deleted: true });
  } catch (err) {
    return toApiError(err);
  }
}
