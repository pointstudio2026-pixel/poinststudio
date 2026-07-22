import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { submitInquirySchema } from "@/modules/inquiries/schemas/inquiry.schemas";
import { inquiriesContainer } from "@/modules/inquiries/container";
import { LOCALE_COOKIE, parseLocaleCookie } from "@/shared/i18n/cookie";

// Route Handler에서는 next/headers의 cookies()가 아니라 requireUser()와
// 동일하게 NextRequest 자체의 쿠키 jar를 읽는다 -- 이 코드베이스의 기존
// Route Handler 관례(getServerLocale()은 지금까지 Server Component에서만
// 쓰여왔고 Route Handler에서 검증된 적이 없다).
function getRequestLocale(request: NextRequest): string {
  return parseLocaleCookie(request.cookies.get(LOCALE_COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  try {
    requireUser(request);
    const locale = getRequestLocale(request);
    const inquiries = await inquiriesContainer.listInquiriesUseCase.execute({ locale });
    return apiSuccess({ inquiries });
  } catch (err) {
    return toApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = submitInquirySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const inquiry = await inquiriesContainer.submitInquiryUseCase.execute({
      userId: session.sub,
      locale: getRequestLocale(request),
      ...parsed.data,
    });

    return apiSuccess({ inquiry }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
