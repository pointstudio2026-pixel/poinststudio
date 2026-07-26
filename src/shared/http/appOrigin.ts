import type { NextRequest } from "next/server";

/**
 * 요청이 실제로 도달한 "공개" 도메인을 반환한다. `new URL(request.url).origin`을
 * 직접 쓰면 Railway처럼 리버스 프록시 뒤에서 도는 배포 환경에서 프록시가
 * 내부적으로 쓰는 주소(예: localhost:8080)가 그대로 잡히는 문제가 있다 --
 * 실사용자가 겪은 버그로, OAuth 미설정 에러 화면으로 돌아가는 링크이
 * localhost로 깨져서 발견됐다.
 *
 * 커스텀 도메인(예: www.designaster.com)이 추가된 뒤로는 고정된
 * APP_BASE_URL만 신뢰하면 안 된다 -- OAuth 로그인을 어느 도메인에서
 * 시작했든 redirect_uri가 항상 APP_BASE_URL(railway.app)로 고정되어,
 * 로그인 후 사용자가 시작 도메인이 아닌 railway.app로 튕기는 버그가
 * 있었다. 리버스 프록시가 원래 클라이언트 요청 호스트를 표준적으로
 * 전달하는 x-forwarded-host/x-forwarded-proto 헤더를 최우선으로 신뢰하고,
 * 그다음 일반 host 헤더, 마지막에만 APP_BASE_URL/request.url로 폴백한다
 * (프록시 헤더가 없는 로컬 개발 환경에서도 여전히 동작).
 */
export function resolveAppOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = request.headers.get("host");
  if (host && !host.includes("localhost") && !host.startsWith("127.0.0.1")) {
    return `https://${host}`;
  }

  return process.env.APP_BASE_URL || new URL(request.url).origin;
}
