import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdmin, requireAdminTier } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { trainingExamplesContainer } from "@/modules/trainingExamples/container";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const examples = await trainingExamplesContainer.listTrainingExamplesUseCase.execute();
    return apiSuccess({ examples });
  } catch (err) {
    return toApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireAdminTier(request, ["super_admin", "manager"]);

    const formData = await request.formData().catch(() => null);
    const prompt = formData?.get("prompt");
    const deliverableType = formData?.get("deliverableType");
    const image = formData?.get("image");

    if (typeof prompt !== "string" || !prompt.trim()) {
      throw new ValidationError("프롬프트를 입력해주세요.", undefined, "TRAINING_EXAMPLE-001");
    }
    if (typeof deliverableType !== "string" || !deliverableType) {
      throw new ValidationError("작업물 유형을 선택해주세요.", undefined, "TRAINING_EXAMPLE-002");
    }
    if (!image || !(image instanceof File)) {
      throw new ValidationError("이미지 파일이 필요합니다.", undefined, "TRAINING_EXAMPLE-003");
    }

    const arrayBuffer = await image.arrayBuffer();
    const example = await trainingExamplesContainer.createTrainingExampleUseCase.execute({
      prompt,
      deliverableType,
      imageData: Buffer.from(arrayBuffer),
      imageContentType: image.type,
      createdByUserId: session.sub,
    });

    return apiSuccess({ example }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
