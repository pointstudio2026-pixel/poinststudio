import { NextResponse, type NextRequest } from "next/server";

// designaster.com(www 없이) 단독 접속 시 www.designaster.com으로 영구
// 리다이렉트한다 -- asterbetatest.up.railway.app이나 www.designaster.com
// 자체는 그대로 유지된다(오직 apex 도메인만 대상). x-forwarded-host를
// host 헤더보다 우선한다(appOrigin.ts와 동일한 이유 -- Railway 리버스
// 프록시 뒤에서 실제 클라이언트가 쓴 호스트를 신뢰하기 위함).
const APEX_DOMAIN = "designaster.com";
const WWW_DOMAIN = "www.designaster.com";

export function middleware(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host === APEX_DOMAIN) {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.host = WWW_DOMAIN;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
