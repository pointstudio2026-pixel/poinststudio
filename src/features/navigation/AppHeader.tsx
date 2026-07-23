import Link from "next/link";
import { PrimaryNav, type PrimaryNavUser } from "@/features/navigation/PrimaryNav";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

/**
 * 로그인 상태 앱 화면(내 프로젝트/프로젝트 작업화면/사용방법/문의사항)이
 * 공유하는 헤더 -- 로고 위치(mx-auto max-w-6xl px-5 sm:px-8 h-16)를
 * 랜딩 페이지 Header.tsx와 동일하게 맞춘다. children은 PrimaryNav
 * 왼쪽에 추가로 넣을 링크(예: 대시보드의 "디자인 메모리")용 슬롯.
 */
export function AppHeader({
  user,
  planCode,
  children,
}: {
  user: PrimaryNavUser;
  planCode: PlanCode;
  children?: React.ReactNode;
}) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/aster-mark.png" alt="ASTER" className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          {children}
          <PrimaryNav user={user} planCode={planCode} />
        </div>
      </div>
    </header>
  );
}
