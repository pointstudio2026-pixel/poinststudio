import type { NextRequest, NextResponse } from "next/server";
import { GUEST_ID_COOKIE, clearGuestIdCookie } from "@/shared/auth/cookies";
import { mockupsContainer } from "@/modules/mockups/container";
import { logger } from "@/shared/logging/logger";

/**
 * "방금 로그인/가입됨" 순간(register, login, oauth callback의 기존계정
 * 로그인, oauth consent의 신규가입 -- refresh는 토큰 갱신일 뿐 신규 로그인
 * 이벤트가 아니라 제외)마다 setAuthCookies 직후 호출한다. guestId 쿠키가
 * 있으면 그 게스트가 만든 목업을 새 계정으로 이전(claim)하고 쿠키를
 * 지운다.
 *
 * Best-effort: recordActivity()와 같은 컨벤션으로 절대 throw하지 않는다 --
 * claim 실패가 로그인/가입 자체를 막으면 안 된다. claim 호출 자체가
 * 실패한 경우에만 쿠키를 지우지 않고 남겨서(claimedCount=0으로 정상
 * 완료된 경우는 지움) 다음 로그인 때 재시도할 수 있게 한다.
 */
export async function claimGuestMockupsIfPresent(
  request: NextRequest,
  res: NextResponse,
  userId: string,
): Promise<void> {
  const guestId = request.cookies.get(GUEST_ID_COOKIE)?.value;
  if (!guestId) return;

  try {
    await mockupsContainer.claimGuestMockupsUseCase.execute({ guestId, userId });
    clearGuestIdCookie(res);
  } catch (err) {
    logger.error("guest mockup claim failed", {
      errorCode: "GUEST_MOCKUP_CLAIM_FAILED",
      userId,
      guestId,
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
