"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/features/landing/Header";
import { ProductMockup } from "@/features/landing/ProductMockup";
import { ResultShowcase } from "@/features/landing/ResultShowcase";
import { FaqAccordion } from "@/features/landing/FaqAccordion";
import { Footer } from "@/features/landing/Footer";
import { PaymentMethodModal } from "@/features/subscription/PaymentMethodModal";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
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
  { step: "01", icon: IconChat, titleKey: "home.howItWorks.interview.title", descriptionKey: "home.howItWorks.interview.description" },
  { step: "02", icon: IconCompass, titleKey: "home.howItWorks.strategy.title", descriptionKey: "home.howItWorks.strategy.description" },
  { step: "03", icon: IconPalette, titleKey: "home.howItWorks.style.title", descriptionKey: "home.howItWorks.style.description" },
  { step: "04", icon: IconImage, titleKey: "home.howItWorks.result.title", descriptionKey: "home.howItWorks.result.description" },
] as const satisfies { step: string; icon: typeof IconChat; titleKey: MessageKey; descriptionKey: MessageKey }[];

const ADVANTAGES = [
  { icon: IconSearch, titleKey: "home.advantages.understand.title", descriptionKey: "home.advantages.understand.description" },
  { icon: IconBranch, titleKey: "home.advantages.compare.title", descriptionKey: "home.advantages.compare.description" },
  { icon: IconLink, titleKey: "home.advantages.connected.title", descriptionKey: "home.advantages.connected.description" },
] as const satisfies { icon: typeof IconSearch; titleKey: MessageKey; descriptionKey: MessageKey }[];

const EXPERTS = [
  { icon: IconCompass, titleKey: "home.experts.strategist.title", descriptionKey: "home.experts.strategist.description" },
  { icon: IconFlag, titleKey: "home.experts.director.title", descriptionKey: "home.experts.director.description" },
  { icon: IconPalette, titleKey: "home.experts.curator.title", descriptionKey: "home.experts.curator.description" },
  { icon: IconTerminal, titleKey: "home.experts.engine.title", descriptionKey: "home.experts.engine.description" },
  { icon: IconShieldCheck, titleKey: "home.experts.qa.title", descriptionKey: "home.experts.qa.description" },
] as const satisfies { icon: typeof IconCompass; titleKey: MessageKey; descriptionKey: MessageKey }[];

const PLANS = [
  {
    code: "Free",
    price: "₩0",
    descriptionKey: "home.pricing.free.description",
    featureKeys: ["home.pricing.free.feature1", "home.pricing.free.feature2"],
    ctaKey: "home.pricing.free.cta",
    href: "/register",
    highlighted: false,
    badge: false,
    comingSoon: false,
  },
  {
    code: "Pro",
    price: "₩29,000",
    descriptionKey: "home.pricing.pro.description",
    featureKeys: ["home.pricing.pro.feature1", "home.pricing.pro.feature2", "home.pricing.pro.feature3"],
    ctaKey: "home.pricing.pro.cta",
    href: "/register",
    highlighted: true,
    badge: true,
    comingSoon: true,
  },
  {
    code: "Studio",
    price: "₩99,000",
    descriptionKey: "home.pricing.studio.description",
    featureKeys: [
      "home.pricing.studio.feature1",
      "home.pricing.studio.feature2",
      "home.pricing.studio.feature3",
      "home.pricing.studio.feature4",
    ],
    ctaKey: "home.pricing.studio.cta",
    href: "/register",
    highlighted: false,
    badge: false,
    comingSoon: true,
  },
] as const satisfies {
  code: string;
  price: string;
  descriptionKey: MessageKey;
  featureKeys: MessageKey[];
  ctaKey: MessageKey;
  href: string;
  highlighted: boolean;
  badge: boolean;
  comingSoon: boolean;
}[];

export interface HomeViewUser {
  email: string;
  name: string | null;
}

export function HomeView({ user, planCode }: { user: HomeViewUser | null; planCode: PlanCode | null }) {
  const { t, locale } = useTranslation();
  // 일본어는 3줄 히어로 타이틀이 64px에서 좌측 칼럼 폭을 넘어 오른쪽 목업
  // 카드와 겹친다 -- 다른 언어보다 한 단계 작게(다른 섹션 h2와 비슷한
  // 스케일로) 낮춰서 칼럼 안에 자연스럽게 들어오게 한다.
  const heroTitleSize =
    locale === "ja" ? "text-[30px] sm:text-[40px] lg:text-[48px]" : "text-[40px] sm:text-[52px] lg:text-[64px]";
  // Pro/Studio는 아직 실제 결제 연동 전이라 "출시 알림 받기" 자리에 /subscription과
  // 동일한 결제 수단 선택 모달을 띄운다(실제 결제는 없음, 안내만).
  const [paymentModalPlan, setPaymentModalPlan] = useState<(typeof PLANS)[number]["code"] | null>(null);

  return (
    <div id="top" className="flex min-h-screen flex-col bg-paper">
      <Header user={user} planCode={planCode} />

      <main className="flex flex-col">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[780px] lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="flex flex-col items-start gap-6">
            <p className="eyebrow text-sm text-muted">{t("home.hero.eyebrow")}</p>
            <h1 className={`${heroTitleSize} leading-[1.08] font-semibold tracking-tight`}>
              {t("home.hero.titleLine1")}
              <br />
              {t("home.hero.titleLine2")}
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-muted">{t("home.hero.body")}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={user ? "/projects" : "/register"} className={BTN_PRIMARY}>
                {t("home.hero.cta")}
              </Link>
              <a href="#preview" className={BTN_SECONDARY}>
                {t("home.hero.seeExample")}
              </a>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span>{t("home.hero.badgeFree")}</span>
              <span>{t("home.hero.badgeNoCard")}</span>
              <span>{t("home.hero.badgeAutosave")}</span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <ProductMockup />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-line bg-surface px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow text-sm text-muted">{t("home.howItWorks.eyebrow")}</p>
            <h2 className="mt-2 text-[32px] font-semibold sm:text-[36px] lg:text-[40px]">{t("home.howItWorks.title")}</h2>

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
                  <h3 className="text-xl font-semibold">{t(item.titleKey)}</h3>
                  <p className="text-base leading-relaxed text-muted">{t(item.descriptionKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Result preview */}
        <section id="preview" className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow text-sm text-muted">{t("home.preview.eyebrow")}</p>
            <h2 className="mt-2 text-[32px] font-semibold sm:text-[36px] lg:text-[40px]">{t("home.preview.title")}</h2>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">{t("home.preview.body")}</p>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <div className="shadow-soft flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6 lg:col-span-1">
                <p className="eyebrow text-xs text-muted">{t("home.preview.inputLabel")}</p>
                <dl className="flex flex-col gap-2 text-base">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">{t("home.preview.brand")}</dt>
                    <dd className="font-medium">{t("home.preview.brandValue")}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">{t("home.preview.industry")}</dt>
                    <dd className="font-medium">{t("home.preview.industryValue")}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">{t("home.preview.target")}</dt>
                    <dd className="font-medium">{t("home.preview.targetValue")}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">{t("home.preview.tone")}</dt>
                    <dd className="font-medium">{t("home.preview.toneValue")}</dd>
                  </div>
                </dl>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[t("home.preview.kw1"), t("home.preview.kw2"), t("home.preview.kw3")].map((kw) => (
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
            <p className="eyebrow text-sm text-muted">{t("home.advantages.eyebrow")}</p>
            <h2 className="mt-2 text-[32px] font-semibold sm:text-[36px] lg:text-[40px]">{t("home.advantages.title")}</h2>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {ADVANTAGES.map((item) => (
                <div key={item.titleKey} className="shadow-soft flex flex-col gap-4 rounded-2xl border border-line bg-paper p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tint-blue">
                    <item.icon className="h-6 w-6 text-ink" />
                  </div>
                  <h3 className="text-xl font-semibold">{t(item.titleKey)}</h3>
                  <p className="text-base leading-relaxed text-muted">{t(item.descriptionKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI experts */}
        <section className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow text-sm text-muted">{t("home.experts.eyebrow")}</p>
            <h2 className="mt-2 max-w-2xl text-[32px] font-semibold leading-tight sm:text-[36px] lg:text-[40px]">
              {t("home.experts.title")}
            </h2>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
              {EXPERTS.map((expert, i) => (
                <div key={expert.titleKey} className="relative flex flex-col items-center gap-3 px-4 py-6 text-center">
                  {i > 0 && (
                    <span className="absolute left-0 top-12 hidden h-px w-full -translate-x-1/2 bg-line lg:block" />
                  )}
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface">
                    <expert.icon className="h-6 w-6 text-ink" />
                  </div>
                  <h3 className="text-base font-semibold">{t(expert.titleKey)}</h3>
                  <p className="text-sm leading-relaxed text-muted">{t(expert.descriptionKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-line bg-surface px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl text-center">
            <p className="eyebrow text-sm text-muted">{t("home.pricing.eyebrow")}</p>
            <h2 className="mt-2 text-[32px] font-semibold sm:text-[36px] lg:text-[40px]">{t("home.pricing.title")}</h2>
            <p className="mt-3 text-lg text-muted">{t("home.pricing.subtitle")}</p>

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
                      {t("home.pricing.popular")}
                    </span>
                  )}
                  <div>
                    <p className={`eyebrow text-sm ${plan.highlighted ? "text-paper/70" : "text-muted"}`}>
                      {plan.code}
                    </p>
                    <p className="mt-2 text-3xl font-semibold">
                      {plan.price}
                      <span className="text-base font-normal">{t("common.perMonth")}</span>
                    </p>
                    <p className={`mt-1 text-sm ${plan.highlighted ? "text-paper/70" : "text-muted"}`}>
                      {t(plan.descriptionKey)}
                    </p>
                    {plan.comingSoon && (
                      <p className={`mt-2 text-xs ${plan.highlighted ? "text-paper/70" : "text-muted"}`}>
                        {t("home.pricing.betaNote")}
                      </p>
                    )}
                  </div>
                  <ul className="flex flex-1 flex-col gap-2 text-base">
                    {plan.featureKeys.map((key) => (
                      <li key={key} className="flex items-center gap-2">
                        <span aria-hidden>·</span>
                        {t(key)}
                      </li>
                    ))}
                  </ul>
                  {plan.comingSoon ? (
                    <button
                      type="button"
                      onClick={() => setPaymentModalPlan(plan.code)}
                      className={`mt-auto flex h-[52px] items-center justify-center rounded-full text-base font-medium transition ${
                        plan.highlighted
                          ? "bg-paper text-ink hover:opacity-90"
                          : "border border-line hover:border-ink"
                      }`}
                    >
                      {t(plan.ctaKey)}
                    </button>
                  ) : (
                    <Link
                      href={user ? "/projects" : plan.href}
                      className={`mt-auto flex h-[52px] items-center justify-center rounded-full text-base font-medium transition ${
                        plan.highlighted
                          ? "bg-paper text-ink hover:opacity-90"
                          : "border border-line hover:border-ink"
                      }`}
                    >
                      {t(plan.ctaKey)}
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
            <p className="eyebrow text-sm text-muted">{t("home.faq.eyebrow")}</p>
            <h2 className="mt-2 text-[32px] font-semibold sm:text-[36px] lg:text-[40px]">{t("home.faq.title")}</h2>
            <p className="mt-3 text-lg text-muted">{t("home.faq.subtitle")}</p>
          </div>
          <div className="mt-10">
            <FaqAccordion />
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-line bg-ink px-5 py-20 text-center text-paper sm:px-8 sm:py-24">
          <h2 className="text-[32px] font-semibold sm:text-[36px] lg:text-[40px]">{t("home.finalCta.title")}</h2>
          <p className="mx-auto mt-3 max-w-md text-lg leading-relaxed text-paper/70">{t("home.finalCta.body")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={user ? "/projects" : "/register"}
              className="inline-flex h-[52px] items-center justify-center rounded-full bg-paper px-7 text-base font-medium text-ink transition hover:opacity-90"
            >
              {t("home.finalCta.cta")}
            </Link>
            <a
              href="#preview"
              className="inline-flex h-[52px] items-center justify-center rounded-full border border-paper/40 px-7 text-base font-medium text-paper transition hover:border-paper"
            >
              {t("home.finalCta.seeExample")}
            </a>
          </div>
        </section>
      </main>

      <Footer />

      {paymentModalPlan && (
        <PaymentMethodModal planLabel={paymentModalPlan} onClose={() => setPaymentModalPlan(null)} />
      )}
    </div>
  );
}
