import Link from "next/link";
import { getCurrentSession } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { Header } from "@/features/landing/Header";
import { ProductMockup } from "@/features/landing/ProductMockup";
import { ResultShowcase } from "@/features/landing/ResultShowcase";
import { FaqAccordion } from "@/features/landing/FaqAccordion";
import { Footer } from "@/features/landing/Footer";
import {
  IconBranch,
  IconChat,
  IconCompass,
  IconFlag,
  IconImage,
  IconLink,
  IconPalette,
  IconSearch,
  IconShieldCheck,
  IconTerminal,
} from "@/features/landing/icons";

const BTN_PRIMARY =
  "inline-flex h-[52px] items-center justify-center rounded-full bg-ink px-7 text-base font-medium text-paper transition hover:opacity-90";
const BTN_SECONDARY =
  "inline-flex h-[52px] items-center justify-center rounded-full border border-line px-7 text-base font-medium transition hover:border-ink";

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: IconChat,
    title: "브랜드 인터뷰",
    description: "질문에 답하면 브랜드의 목적과 고객을 정리합니다.",
  },
  {
    step: "02",
    icon: IconCompass,
    title: "전략 분석",
    description: "AI가 핵심 가치, 타깃, 포지셔닝과 톤을 분석합니다.",
  },
  {
    step: "03",
    icon: IconPalette,
    title: "스타일 제안",
    description: "브랜드에 맞는 디자인 방향, 컬러, 폰트를 제안합니다.",
  },
  {
    step: "04",
    icon: IconImage,
    title: "결과물 제작",
    description: "선택한 방향을 바탕으로 콘셉트보드와 목업을 만듭니다.",
  },
];

const ADVANTAGES = [
  {
    icon: IconSearch,
    title: "브랜드부터 이해합니다",
    description: "단순 이미지 생성 전에 브랜드 목적과 고객을 먼저 분석합니다.",
  },
  {
    icon: IconBranch,
    title: "방향을 여러 개 비교합니다",
    description: "하나의 정답을 강요하지 않고 서로 다른 콘셉트를 비교합니다.",
  },
  {
    icon: IconLink,
    title: "결과물이 한 프로젝트에 연결됩니다",
    description: "전략, 스타일, 이미지, 목업, 내보내기를 한곳에서 관리합니다.",
  },
];

const EXPERTS = [
  { icon: IconCompass, title: "브랜드 전략가", description: "브랜드 목적과 포지셔닝을 분석합니다." },
  { icon: IconFlag, title: "크리에이티브 디렉터", description: "전체 컨셉의 방향을 조율합니다." },
  { icon: IconPalette, title: "스타일 큐레이터", description: "브랜드에 맞는 스타일을 추천합니다." },
  { icon: IconTerminal, title: "프롬프트 엔진", description: "방향을 실제 생성 프롬프트로 변환합니다." },
  { icon: IconShieldCheck, title: "품질 검토 AI", description: "결과물의 일관성과 품질을 검토합니다." },
];

const PLANS = [
  {
    code: "Free",
    price: "₩0",
    period: "/월",
    description: "가볍게 시작하는 디자이너를 위한 플랜",
    features: ["월 10회 생성", "기본 스타일 추천"],
    cta: "무료로 시작하기",
    href: "/register",
    highlighted: false,
    badge: null as string | null,
    comingSoon: false,
  },
  {
    code: "Pro",
    price: "₩29,000",
    period: "/월",
    description: "매일 다수의 클라이언트를 다루는 프로를 위한 플랜",
    features: ["브랜드 프로젝트에 충분한 월간 생성 횟수", "내 스타일 기능", "목업 기능"],
    cta: "출시 알림 받기",
    href: "/register",
    highlighted: true,
    badge: "가장 인기 있음",
    comingSoon: true,
  },
  {
    code: "Studio",
    price: "₩99,000",
    period: "/월",
    description: "기업 및 에이전시를 위한 팀 플랜",
    features: ["대용량 생성 횟수", "내 스타일 기능", "목업 기능", "팀 기능"],
    cta: "출시 알림 받기",
    href: "/register",
    highlighted: false,
    badge: null,
    comingSoon: true,
  },
];

export default async function HomePage() {
  const session = await getCurrentSession();
  const user = session ? await authContainer.getMeUseCase.execute({ userId: session.sub }) : null;
  const subscription = session
    ? await subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub })
    : null;

  return (
    <div id="top" className="flex min-h-screen flex-col bg-paper">
      <Header
        user={user ? { email: user.email, name: user.name } : null}
        planCode={subscription?.planCode ?? null}
      />

      <main className="flex flex-col">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[780px] lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="flex flex-col items-start gap-6">
            <p className="eyebrow text-sm text-muted">디자이너의 사고 과정을 빠르게 만드는 도구</p>
            <h1 className="text-[40px] leading-[1.08] font-semibold tracking-tight sm:text-[52px] lg:text-[64px]">
              브랜드의 방향성과
              <br />
              디자인 아이디어를 빠르게.
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-muted">
              좋은 디자인은 방향에서 시작됩니다. Aster가 만든 이미지는 완성본이 아니라, 다음
              디자인으로 나아갈 방향을 보여주는 참고 레퍼런스입니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className={BTN_PRIMARY}>
                무료로 시작하기
              </Link>
              <a href="#preview" className={BTN_SECONDARY}>
                결과 예시 보기
              </a>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span>무료 플랜 제공</span>
              <span>카드 등록 없이 시작</span>
              <span>프로젝트 자동 저장</span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <ProductMockup />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-line bg-surface px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow text-sm text-muted">How it works</p>
            <h2 className="mt-2 text-[32px] font-semibold sm:text-[36px] lg:text-[40px]">사용 방법</h2>

            <div className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((item) => (
                <div
                  key={item.step}
                  className="shadow-soft group flex flex-col gap-4 rounded-2xl border border-line bg-paper p-6 transition hover:-translate-y-1 hover:border-ink"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-semibold text-line group-hover:text-muted">{item.step}</span>
                    <item.icon className="h-7 w-7 text-ink" />
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-base leading-relaxed text-muted">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Result preview */}
        <section id="preview" className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow text-sm text-muted">Result Preview</p>
            <h2 className="mt-2 text-[32px] font-semibold sm:text-[36px] lg:text-[40px]">
              입력 하나가 이렇게 완성됩니다.
            </h2>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
              간단한 브랜드 정보만 입력하면 ASTER가 전략과 디자인 방향을 하나의 결과물로 정리합니다.
            </p>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <div className="shadow-soft flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6 lg:col-span-1">
                <p className="eyebrow text-xs text-muted">Input / 요청사항</p>
                <dl className="flex flex-col gap-2 text-base">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">브랜드</dt>
                    <dd className="font-medium">비건 코스메틱</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">업종</dt>
                    <dd className="font-medium">뷰티/화장품</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">타깃</dt>
                    <dd className="font-medium">20~30대 여성</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">톤앤매너</dt>
                    <dd className="font-medium">미니멀 & 내추럴</dd>
                  </div>
                </dl>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["신뢰", "저자극", "미니멀"].map((kw) => (
                    <span key={kw} className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2">
                <ResultShowcase />
              </div>
            </div>
          </div>
        </section>

        {/* Core advantages */}
        <section className="border-t border-line bg-surface px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow text-sm text-muted">Why Aster</p>
            <h2 className="mt-2 text-[32px] font-semibold sm:text-[36px] lg:text-[40px]">핵심 장점</h2>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {ADVANTAGES.map((item) => (
                <div key={item.title} className="shadow-soft flex flex-col gap-4 rounded-2xl border border-line bg-paper p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tint-blue">
                    <item.icon className="h-6 w-6 text-ink" />
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-base leading-relaxed text-muted">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI experts */}
        <section className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow text-sm text-muted">Multi-Agent Analysis</p>
            <h2 className="mt-2 max-w-2xl text-[32px] font-semibold leading-tight sm:text-[36px] lg:text-[40px]">
              하나의 AI가 아니라, 역할이 다른 AI가 함께 분석합니다.
            </h2>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
              {EXPERTS.map((expert, i) => (
                <div key={expert.title} className="relative flex flex-col items-center gap-3 px-4 py-6 text-center">
                  {i > 0 && (
                    <span className="absolute left-0 top-12 hidden h-px w-full -translate-x-1/2 bg-line lg:block" />
                  )}
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface">
                    <expert.icon className="h-6 w-6 text-ink" />
                  </div>
                  <h3 className="text-base font-semibold">{expert.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{expert.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-line bg-surface px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl text-center">
            <p className="eyebrow text-sm text-muted">Pricing</p>
            <h2 className="mt-2 text-[32px] font-semibold sm:text-[36px] lg:text-[40px]">요금제</h2>
            <p className="mt-3 text-lg text-muted">Free 플랜은 지금 바로 무료로 시작할 수 있습니다.</p>

            <div className="mt-12 grid items-stretch gap-6 sm:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.code}
                  className={`shadow-soft relative flex h-full flex-col gap-5 rounded-2xl border p-7 text-left ${
                    plan.highlighted ? "border-ink bg-ink text-paper" : "border-line bg-paper"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 right-6 rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink shadow-soft">
                      {plan.badge}
                    </span>
                  )}
                  <div>
                    <p className={`eyebrow text-sm ${plan.highlighted ? "text-paper/70" : "text-muted"}`}>
                      {plan.code}
                    </p>
                    <p className="mt-2 text-3xl font-semibold">
                      {plan.price}
                      {plan.period && <span className="text-base font-normal">{plan.period}</span>}
                    </p>
                    <p className={`mt-1 text-sm ${plan.highlighted ? "text-paper/70" : "text-muted"}`}>
                      {plan.description}
                    </p>
                    {plan.comingSoon && (
                      <p className={`mt-2 text-xs ${plan.highlighted ? "text-paper/70" : "text-muted"}`}>
                        사전 알림 신청 시 베타 사용자 혜택 제공
                      </p>
                    )}
                  </div>
                  <ul className="flex flex-1 flex-col gap-2 text-base">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span aria-hidden>·</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {!plan.comingSoon && (
                    <Link
                      href={plan.href}
                      className={`mt-auto flex h-[52px] items-center justify-center rounded-full text-base font-medium transition ${
                        plan.highlighted
                          ? "bg-paper text-ink hover:opacity-90"
                          : "border border-line hover:border-ink"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[880px] text-center">
            <p className="eyebrow text-sm text-muted">FAQ</p>
            <h2 className="mt-2 text-[32px] font-semibold sm:text-[36px] lg:text-[40px]">자주 묻는 질문</h2>
            <p className="mt-3 text-lg text-muted">궁금한 점을 먼저 확인해보세요.</p>
          </div>
          <div className="mt-10">
            <FaqAccordion />
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-line bg-ink px-5 py-20 text-center text-paper sm:px-8 sm:py-24">
          <h2 className="text-[32px] font-semibold sm:text-[36px] lg:text-[40px]">
            첫 번째 브랜드 프로젝트를 시작해보세요.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-lg leading-relaxed text-paper/70">
            복잡한 프롬프트 없이 질문에 답하는 것부터 시작할 수 있습니다.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex h-[52px] items-center justify-center rounded-full bg-paper px-7 text-base font-medium text-ink transition hover:opacity-90"
            >
              무료로 시작하기
            </Link>
            <a
              href="#preview"
              className="inline-flex h-[52px] items-center justify-center rounded-full border border-paper/40 px-7 text-base font-medium text-paper transition hover:border-paper"
            >
              결과 예시 보기
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
