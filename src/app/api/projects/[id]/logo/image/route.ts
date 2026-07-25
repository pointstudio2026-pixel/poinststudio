import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/shared/auth/session";
import { toApiError } from "@/shared/http/response";
import { projectLogosContainer } from "@/modules/projectLogos/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** user-styles의 참고 이미지 서빙 라우트와 동일 패턴 -- 세션 인증으로 매 요청 소유권 확인. */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id } = await params;
    const file = await projectLogosContainer.getProjectLogoImageUseCase.execute({
      userId: session.sub,
      projectId: id,
    });

    return new NextResponse(new Uint8Array(file.data), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return toApiError(err);
  }
}
