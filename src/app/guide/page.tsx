import Link from "next/link";
import { Header } from "@/features/landing/Header";
import { Footer } from "@/features/landing/Footer";
import { getCurrentSession } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { BRANDING_WORKSPACE_STEPS } from "@/modules/projects/domain/Project";

export default async function GuidePage() {
  const session = await getCurrentSession();
  const user = session ? await authContainer.getMeUseCase.execute({ userId: session.sub }) : null;
  const subscription = session
    ? await subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub })
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Header
        user={user ? { email: user.email, name: user.name } : null}
        planCode={subscription?.planCode ?? null}
      />

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-16 px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-sm text-muted">사용방법</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            내 프로젝트와 팀 기능, 이렇게 사용하세요
          </h1>
          <p className="text-muted">
            브랜드 이미지를 만드는 전체 흐름과, 팀원과 프로젝트를 함께 작업하는 방법을 정리했습니다.
          </p>
        </div>

        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold">내 프로젝트</h2>
          <p className="text-muted">
            <Link href="/projects" className="underline underline-offset-4">
              내 프로젝트
            </Link>{" "}
            대시보드에서 새 프로젝트를 만들면, 아래 단계를 순서대로 거쳐 결과물을 만듭니다. 각
            단계는 언제든 대시보드로 돌아와 이어서 진행할 수 있습니다.
          </p>
          <ol className="flex flex-col gap-3">
            {BRANDING_WORKSPACE_STEPS.map((step, index) => (
              <li key={step.key} className="flex items-baseline gap-3 rounded-xl border border-line bg-surface p-4">
                <span className="text-sm font-medium text-muted">{index + 1}</span>
                <span className="font-medium">{step.label}</span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted">
            로고/브랜딩이 아닌 포스터·리플렛 등 다른 작업물 유형은 &quot;브랜드 전략&quot;과
            &quot;로고 스타일&quot; 두 단계가 생략됩니다.
          </p>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold">팀 기능</h2>
          <p className="text-muted">
            팀 기능은 <strong className="text-ink">Studio 요금제</strong>에서 사용할 수 있습니다.
            무료/Pro 플랜에서는 다른 사람의 팀에 코드로 참여할 수는 있지만, 팀을 직접 등록할 수는
            없습니다.
          </p>
          <ol className="flex flex-col gap-3">
            <li className="rounded-xl border border-line bg-surface p-4">
              <p className="font-medium">1. 팀 등록</p>
              <p className="mt-1 text-sm text-muted">
                Studio 사용자가{" "}
                <Link href="/team" className="underline underline-offset-4">
                  팀
                </Link>{" "}
                페이지에서 팀을 등록하면 고유한 6자리 코드가 발급됩니다.
              </p>
            </li>
            <li className="rounded-xl border border-line bg-surface p-4">
              <p className="font-medium">2. 코드 공유 및 참여</p>
              <p className="mt-1 text-sm text-muted">
                이 코드를 팀원에게 전달하면, 팀원은 같은 팀 페이지에서 코드를 입력해 팀에
                참여합니다.
              </p>
            </li>
            <li className="rounded-xl border border-line bg-surface p-4">
              <p className="font-medium">3. 프로젝트 공유</p>
              <p className="mt-1 text-sm text-muted">
                대시보드에서 프로젝트의 &quot;⋯&quot; 메뉴로 원하는 프로젝트만 &quot;팀에
                공유&quot;로 켜면, 팀원이 대시보드에서 그 프로젝트를 함께 보고 수정할 수 있습니다.
              </p>
            </li>
          </ol>
        </section>
      </main>

      <Footer />
    </div>
  );
}
