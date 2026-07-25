import Link from "next/link";
import { Header } from "@/features/landing/Header";
import { AppHeader } from "@/features/navigation/AppHeader";
import { Footer } from "@/features/landing/Footer";
import { getCurrentSession } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { BRANDING_WORKSPACE_STEPS } from "@/modules/projects/domain/Project";
import { IconLayers, IconLink, IconPalette } from "@/features/landing/icons";

export default async function GuidePage() {
  const session = await getCurrentSession();
  const user = session ? await authContainer.getMeUseCase.execute({ userId: session.sub }) : null;
  const subscription = session
    ? await subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub })
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {user ? (
        <AppHeader user={{ email: user.email, name: user.name }} planCode={subscription?.planCode ?? "free"} />
      ) : (
        <Header user={null} planCode={null} />
      )}

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-sm text-muted">사용방법</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            내 프로젝트 / 내 스타일 / 팀, 이렇게 사용하세요
          </h1>
          <p className="text-muted">
            브랜드 이미지를 만드는 전체 흐름과, 스타일을 저장해 재사용하는 방법, 팀원과 프로젝트를
            함께 작업하는 방법을 정리했습니다.
          </p>
        </div>

        <section className="shadow-soft flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-tint-blue">
              <IconLayers className="h-5 w-5 text-ink" />
            </div>
            <h2 className="text-xl font-semibold">내 프로젝트</h2>
          </div>
          <p className="text-muted">
            <Link href="/projects" className="underline underline-offset-4">
              내 프로젝트
            </Link>{" "}
            대시보드에서 새 프로젝트를 만들면, 아래 단계를 순서대로 거쳐 결과물을 만듭니다. 각
            단계는 언제든 대시보드로 돌아와 이어서 진행할 수 있습니다.
          </p>
          <ol className="flex flex-col gap-3">
            {BRANDING_WORKSPACE_STEPS.map((step, index) => (
              <li key={step.key} className="flex items-baseline gap-3 rounded-xl border border-line bg-paper p-4">
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

        <section className="shadow-soft flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-tint-blue">
              <IconPalette className="h-5 w-5 text-ink" />
            </div>
            <h2 className="text-xl font-semibold">내 스타일</h2>
            <span className="rounded-full bg-tint-beige px-2 py-0.5 text-xs font-medium text-ink">Pro 이상</span>
          </div>
          <p className="text-muted">
            내 스타일은 <strong className="text-ink">Pro 요금제</strong>부터 사용할 수 있습니다. 직접
            등록한 참고 이미지를 계정 전체에서 재사용해, 매 프로젝트마다 같은 무드를 다시 설명할
            필요 없이 스타일을 바로 적용할 수 있습니다.
          </p>
          <ol className="flex flex-col gap-3">
            <li className="rounded-xl border border-line bg-paper p-4">
              <p className="font-medium">1. 카테고리 만들기</p>
              <p className="mt-1 text-sm text-muted">
                <Link href="/my-styles" className="underline underline-offset-4">
                  내 스타일
                </Link>{" "}
                페이지에서 원하는 이름(예: &quot;우리 브랜드 로고 스타일&quot;)으로 카테고리를
                만듭니다.
              </p>
            </li>
            <li className="rounded-xl border border-line bg-paper p-4">
              <p className="font-medium">2. 참고 이미지 등록</p>
              <p className="mt-1 text-sm text-muted">
                카테고리마다 참고 이미지를 최대 5장까지 업로드하면, AI가 자동으로 스타일을 분석해
                요약해둡니다.
              </p>
            </li>
            <li className="rounded-xl border border-line bg-paper p-4">
              <p className="font-medium">3. 스타일 단계에서 활용</p>
              <p className="mt-1 text-sm text-muted">
                프로젝트의 스타일 선택 단계에서 등록해둔 내 스타일을 고르면, 그 무드가 그대로
                이미지 생성에 반영됩니다.
              </p>
            </li>
          </ol>
        </section>

        <section className="shadow-soft flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-tint-blue">
              <IconLink className="h-5 w-5 text-ink" />
            </div>
            <h2 className="text-xl font-semibold">팀</h2>
            <span className="rounded-full bg-tint-beige px-2 py-0.5 text-xs font-medium text-ink">Studio 전용</span>
          </div>
          <p className="text-muted">
            팀 기능은 <strong className="text-ink">Studio 요금제</strong>에서 사용할 수 있습니다.
            무료/Pro 플랜에서는 다른 사람의 팀에 코드로 참여할 수는 있지만, 팀을 직접 등록할 수는
            없습니다.
          </p>
          <ol className="flex flex-col gap-3">
            <li className="rounded-xl border border-line bg-paper p-4">
              <p className="font-medium">1. 팀 등록</p>
              <p className="mt-1 text-sm text-muted">
                Studio 사용자가{" "}
                <Link href="/team" className="underline underline-offset-4">
                  팀
                </Link>{" "}
                페이지에서 팀을 등록하면 고유한 6자리 코드가 발급됩니다.
              </p>
            </li>
            <li className="rounded-xl border border-line bg-paper p-4">
              <p className="font-medium">2. 코드 공유 및 참여</p>
              <p className="mt-1 text-sm text-muted">
                이 코드를 팀원에게 전달하면, 팀원은 같은 팀 페이지에서 코드를 입력해 팀에
                참여합니다.
              </p>
            </li>
            <li className="rounded-xl border border-line bg-paper p-4">
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
