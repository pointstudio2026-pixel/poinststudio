import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { industriesContainer } from "@/modules/industries/container";
import { isLocale, DEFAULT_LOCALE } from "@/shared/i18n/locale";

/** 인터뷰의 업종 검색형 드롭다운용 -- 로그인 여부와 무관하게 공개(스타일/목업
 * 템플릿 검색과 동일하게 카탈로그 열람 자체엔 인증이 필요 없다). */
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q") ?? "";
    const localeParam = request.nextUrl.searchParams.get("locale");
    const locale = isLocale(localeParam) ? localeParam : DEFAULT_LOCALE;
    const industries = await industriesContainer.searchIndustriesUseCase.execute(query, locale);
    return apiSuccess({ industries });
  } catch (err) {
    return toApiError(err);
  }
}
