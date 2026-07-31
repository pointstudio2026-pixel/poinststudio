import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { mockupsContainer } from "@/modules/mockups/container";
import { isLocale, DEFAULT_LOCALE } from "@/shared/i18n/locale";

// 읽기 전용(비용/한도 무관) -- 게스트 목업 플로우가 배경 템플릿을
// 검색할 수 있어야 해서 로그인 여부와 무관하게 공개한다.
export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const query = params.get("q") ?? "";
    const localeParam = params.get("locale");
    const locale = isLocale(localeParam) ? localeParam : DEFAULT_LOCALE;
    const templates = await mockupsContainer.searchMockupTemplatesUseCase.execute({ query, locale });
    return apiSuccess({ templates });
  } catch (err) {
    return toApiError(err);
  }
}
