import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { mockupsContainer } from "@/modules/mockups/container";
import type { MockupCategory } from "@/modules/mockups/domain/Mockup";
import { isLocale, DEFAULT_LOCALE } from "@/shared/i18n/locale";

// 읽기 전용(비용/한도 무관) -- 게스트 목업 플로우가 배경 템플릿을
// 고를 수 있어야 해서 로그인 여부와 무관하게 공개한다.
export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const category = params.get("category") as MockupCategory | null;
    const localeParam = params.get("locale");
    const locale = isLocale(localeParam) ? localeParam : DEFAULT_LOCALE;
    const result = await mockupsContainer.getMockupTemplatesUseCase.execute({ category: category ?? undefined, locale });
    return apiSuccess(result);
  } catch (err) {
    return toApiError(err);
  }
}
