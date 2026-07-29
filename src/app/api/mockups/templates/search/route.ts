import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { mockupsContainer } from "@/modules/mockups/container";
import { isLocale, DEFAULT_LOCALE } from "@/shared/i18n/locale";

export async function GET(request: NextRequest) {
  try {
    requireUser(request);
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
