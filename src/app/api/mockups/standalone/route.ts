import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { getOptionalUser } from "@/shared/auth/session";
import { GUEST_ID_COOKIE, setGuestIdCookie } from "@/shared/auth/cookies";
import { ValidationError } from "@/shared/errors/AppError";
import { mockupsContainer } from "@/modules/mockups/container";
import type { StandaloneMockupCaller, StandaloneMockupSource } from "@/modules/mockups/application/CreateStandaloneMockupUseCase";

export async function POST(request: NextRequest) {
  // 세션이 없으면 게스트 -- 실패 응답에도 같은 guestId를 다시 실어야
  // 한다(성공 때만 쿠키를 세팅하면 3회 초과로 막힌 응답엔 쿠키가 안 실려
  // 새로고침 시 새 guestId가 발급되며 카운트가 조용히 리셋된다).
  let guestId: string | undefined;

  try {
    const session = getOptionalUser(request);

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      throw new ValidationError("요청 형식이 올바르지 않습니다.", undefined, "STANDALONE_MOCKUP-003");
    }

    const templateId = formData.get("templateId");
    if (typeof templateId !== "string" || !templateId) {
      throw new ValidationError("templateId가 필요합니다.", undefined, "STANDALONE_MOCKUP-004");
    }

    const file = formData.get("file");
    const imageUrl = formData.get("imageUrl");

    let source: StandaloneMockupSource;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      source = { type: "upload", data: Buffer.from(arrayBuffer), contentType: file.type };
    } else if (typeof imageUrl === "string" && imageUrl) {
      source = { type: "past_generation", imageUrl };
    } else {
      throw new ValidationError(
        "로고 파일(file) 또는 과거 생성 이미지 URL(imageUrl) 중 하나가 필요합니다.",
        undefined,
        "STANDALONE_MOCKUP-005",
      );
    }

    let caller: StandaloneMockupCaller;
    if (session) {
      caller = { kind: "user", userId: session.sub, userRole: session.role };
    } else {
      guestId = request.cookies.get(GUEST_ID_COOKIE)?.value ?? crypto.randomUUID();
      caller = { kind: "guest", guestId };
    }

    const mockup = await mockupsContainer.createStandaloneMockupUseCase.execute({ caller, templateId, source });

    const res = apiSuccess({ mockup }, { status: 201 });
    if (guestId) setGuestIdCookie(res, guestId);
    return res;
  } catch (err) {
    const res = toApiError(err);
    if (guestId) setGuestIdCookie(res, guestId);
    return res;
  }
}
