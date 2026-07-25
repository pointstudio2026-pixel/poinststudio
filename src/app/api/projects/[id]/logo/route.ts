import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { projectLogosContainer } from "@/modules/projectLogos/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id } = await params;

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    if (!file || !(file instanceof File)) {
      throw new ValidationError("이미지 파일이 필요합니다.", undefined, "PROJECT_LOGO-004");
    }

    const arrayBuffer = await file.arrayBuffer();
    const asset = await projectLogosContainer.addProjectLogoUseCase.execute({
      userId: session.sub,
      projectId: id,
      data: Buffer.from(arrayBuffer),
      contentType: file.type,
      originalFileName: file.name,
    });

    return apiSuccess({ asset }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
