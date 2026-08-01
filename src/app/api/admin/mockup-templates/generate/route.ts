import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdmin } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { mockupsContainer } from "@/modules/mockups/container";
import { MOCKUP_CATEGORIES, type MockupCategory } from "@/modules/mockups/domain/Mockup";
import { PLACEHOLDER_SHAPES, type PlaceholderShape } from "@/shared/ai/mockupBackgroundGenerationRules";

/**
 * 관리자 채팅형 목업 배경 생성 -- 확정("확인") 전 미리보기 단계라 아무것도
 * DB/스토리지에 쓰지 않는다. 재생성을 여러 번 눌러도 흔적이 안 남는다.
 */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      throw new ValidationError("요청 형식이 올바르지 않습니다.", undefined, "ADMIN_MOCKUP_GEN-001");
    }

    const category = formData.get("category");
    if (typeof category !== "string" || !(MOCKUP_CATEGORIES as readonly string[]).includes(category)) {
      throw new ValidationError("카테고리가 올바르지 않습니다.", undefined, "ADMIN_MOCKUP_GEN-002");
    }
    const description = formData.get("description");
    if (typeof description !== "string" || !description.trim()) {
      throw new ValidationError("설명(프롬프트)을 입력해주세요.", undefined, "ADMIN_MOCKUP_GEN-003");
    }
    const shape = formData.get("shape");
    if (typeof shape !== "string" || !(PLACEHOLDER_SHAPES as readonly string[]).includes(shape)) {
      throw new ValidationError("자리표시자 모양이 올바르지 않습니다.", undefined, "ADMIN_MOCKUP_GEN-004");
    }
    const containsKoreanText = formData.get("containsKoreanText") === "true";
    const isGeneric = formData.get("isGeneric") === "true";

    const file = formData.get("referenceImage");
    const referenceImage =
      file instanceof File
        ? { buffer: Buffer.from(await file.arrayBuffer()), contentType: file.type || "image/png" }
        : null;

    const result = await mockupsContainer.generateMockupBackgroundImageUseCase.execute({
      category: category as MockupCategory,
      description,
      shape: shape as PlaceholderShape,
      containsKoreanText,
      isGeneric,
      referenceImage,
    });

    return apiSuccess({ result });
  } catch (err) {
    return toApiError(err);
  }
}
