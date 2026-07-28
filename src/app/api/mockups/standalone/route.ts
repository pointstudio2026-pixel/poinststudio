import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { mockupsContainer } from "@/modules/mockups/container";
import type { StandaloneMockupSource } from "@/modules/mockups/application/CreateStandaloneMockupUseCase";

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      throw new ValidationError("요청 형식이 올바르지 않습니다.", undefined, "STANDALONE_MOCKUP-003");
    }

    const templateId = formData.get("templateId");
    if (typeof templateId !== "string" || !templateId) {
      throw new ValidationError("templateId가 필요합니다.", undefined, "STANDALONE_MOCKUP-004");
    }

    const file = formData.get("file");
    const imageUrl = formData.get("imageUrl");

    let source: StandaloneMockupSource;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      source = { type: "upload", data: Buffer.from(arrayBuffer), contentType: file.type };
    } else if (typeof imageUrl === "string" && imageUrl) {
      source = { type: "past_generation", imageUrl };
    } else {
      throw new ValidationError(
        "로고 파일(file) 또는 과거 생성 이미지 URL(imageUrl) 중 하나가 필요합니다.",
        undefined,
        "STANDALONE_MOCKUP-005",
      );
    }

    const mockup = await mockupsContainer.createStandaloneMockupUseCase.execute({
      userId: session.sub,
      templateId,
      source,
      userRole: session.role,
    });

    return apiSuccess({ mockup }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
