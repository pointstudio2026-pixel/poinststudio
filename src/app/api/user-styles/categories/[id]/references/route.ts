import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { userStylesContainer } from "@/modules/userStyles/container";

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
      throw new ValidationError("이미지 파일이 필요합니다.", undefined, "USER_STYLE-006");
    }

    const arrayBuffer = await file.arrayBuffer();
    const category = await userStylesContainer.addReferenceImageUseCase.execute({
      userId: session.sub,
      categoryId: id,
      data: Buffer.from(arrayBuffer),
      contentType: file.type,
    });

    return apiSuccess({ category }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
