import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { submitInquirySchema } from "@/modules/inquiries/schemas/inquiry.schemas";
import { inquiriesContainer } from "@/modules/inquiries/container";

export async function GET(request: NextRequest) {
  try {
    requireUser(request);
    const inquiries = await inquiriesContainer.listInquiriesUseCase.execute();
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
      ...parsed.data,
    });

    return apiSuccess({ inquiry }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
