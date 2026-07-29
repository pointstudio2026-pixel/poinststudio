import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { mockupsContainer } from "@/modules/mockups/container";
import type { MockupCategory } from "@/modules/mockups/domain/Mockup";
import { isLocale, DEFAULT_LOCALE } from "@/shared/i18n/locale";

export async function GET(request: NextRequest) {
  try {
    requireUser(request);
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
