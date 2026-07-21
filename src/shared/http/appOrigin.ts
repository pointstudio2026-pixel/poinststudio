import type { NextRequest } from "next/server";

/**
 * 요청이 실제로 도달한 "공개" 도메인을 반환한다. `new URL(request.url).origin`을
 * 직접 쓰면 Railway처럼 리버스 프록시 뒤에서 도는 배포 환경에서 프록시가
 * 내부적으로 쓰는 주소(예: localhost:8080)가 그대로 잡히는 문제가 있다 --
 * 실사용자가 겪은 버그로, OAuth 미설정 에러 화면으로 돌아가는 링크가
 * localhost로 깨져서 발견됐다. APP_BASE_URL 환경변수를 우선 신뢰하고,
 * 없을 때만 요청 URL로 폴백한다. 로컬 개발은 .env.example에 이미
 * APP_BASE_URL="http://localhost:3100"이 기본값으로 있어 그대로 동작한다.
 */
export function resolveAppOrigin(request: NextRequest): string {
  return process.env.APP_BASE_URL || new URL(request.url).origin;
}
