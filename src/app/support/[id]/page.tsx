import Link from "next/link";
import { requireSessionOrRedirect } from "@/shared/auth/session";
import { inquiriesContainer } from "@/modules/inquiries/container";
import type { Inquiry } from "@/modules/inquiries/domain/Inquiry";
import { AppError } from "@/shared/errors/AppError";

interface PageParams {
  params: Promise<{ id: string }>;
}

async function loadInquiry(
  id: string,
  userId: string,
  userRole: "designer" | "admin",
): Promise<{ inquiry: Inquiry; error: null } | { inquiry: null; error: string }> {
  try {
    const inquiry = await inquiriesContainer.getInquiryUseCase.execute({
      inquiryId: id,
      userId,
      userRole,
    });
    return { inquiry, error: null };
  } catch (err) {
    return { inquiry: null, error: err instanceof AppError ? err.message : "문의를 불러오지 못했습니다." };
  }
}

export default async function InquiryDetailPage({ params }: PageParams) {
  const session = await requireSessionOrRedirect();
  const { id } = await params;
  const { inquiry, error } = await loadInquiry(id, session.sub, session.role);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">문의사항</h1>
        <Link href="/support" className="text-sm underline">
          목록으로
        </Link>
      </div>

      {inquiry ? (
        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                inquiry.isPublic ? "bg-neutral-100 text-neutral-600" : "bg-amber-50 text-amber-700"
              }`}
            >
              {inquiry.isPublic ? "전체공개" : "비공개"}
            </span>
            <span className="text-xs text-neutral-400">
              {new Date(inquiry.createdAt).toLocaleString("ko-KR")}
            </span>
          </div>
          <h2 className="text-lg font-medium">{inquiry.subject}</h2>
          <p className="whitespace-pre-wrap text-sm text-neutral-700">{inquiry.message}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 p-6 text-center text-sm text-neutral-500">
          {error}
        </div>
      )}
    </main>
  );
}
