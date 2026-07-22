import { requireSessionOrRedirect } from "@/shared/auth/session";
import { inquiriesContainer } from "@/modules/inquiries/container";
import { AppError } from "@/shared/errors/AppError";
import { InquiryDetailView } from "@/features/support/InquiryDetailView";

interface PageParams {
  params: Promise<{ id: string }>;
}

async function loadInquiry(id: string, userId: string, userRole: "designer" | "admin") {
  try {
    const inquiry = await inquiriesContainer.getInquiryUseCase.execute({ inquiryId: id, userId, userRole });
    return {
      inquiry: {
        subject: inquiry.subject,
        message: inquiry.message,
        isPublic: inquiry.isPublic,
        createdAt: inquiry.createdAt.toISOString(),
      },
      errorCode: undefined,
    };
  } catch (err) {
    return { inquiry: null, errorCode: err instanceof AppError ? err.code : undefined };
  }
}

export default async function InquiryDetailPage({ params }: PageParams) {
  const session = await requireSessionOrRedirect();
  const { id } = await params;
  const { inquiry, errorCode } = await loadInquiry(id, session.sub, session.role);

  return <InquiryDetailView inquiry={inquiry} errorCode={errorCode} />;
}
