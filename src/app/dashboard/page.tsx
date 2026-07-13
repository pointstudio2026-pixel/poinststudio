import { requireSessionOrRedirect } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { LogoutButton } from "@/features/auth/LogoutButton";

// Task-005(Dashboard)에서 실제 화면(프로젝트 목록, 사용량 등)으로 대체된다.
// 지금은 Task-002/003 로그인 흐름의 리다이렉트 대상 + 보호 라우트 검증용 placeholder.
export default async function DashboardPage() {
  const session = await requireSessionOrRedirect();
  const user = await authContainer.getMeUseCase.execute({ userId: session.sub });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-neutral-500">{user.email}님, 환영합니다.</p>
      <LogoutButton />
    </main>
  );
}
