import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/shared/auth/session";
import { toApiError } from "@/shared/http/response";
import { trainingExamplesContainer } from "@/modules/trainingExamples/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    requireAdmin(request);
    const { id } = await params;
    const file = await trainingExamplesContainer.getTrainingExampleImageUseCase.execute({ id });

    return new NextResponse(new Uint8Array(file.data), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return toApiError(err);
  }
}
