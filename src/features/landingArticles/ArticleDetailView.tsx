import Link from "next/link";
import Image from "next/image";
import { Header } from "@/features/landing/Header";
import { AppHeader } from "@/features/navigation/AppHeader";
import { Footer } from "@/features/landing/Footer";
import { getCurrentSession } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import type {
  FaqArticleContent,
  LandingArticle,
  StyleGuideContent,
  WhyAsterPageContent,
} from "@/modules/landingArticles/domain/LandingArticle";
import { landingArticlesContainer } from "@/modules/landingArticles/container";
import { guideDetailHref, guidesHubHref, guidesHubHrefForCategory } from "@/features/landingArticles/routing";
import { getLandingArticleLabels } from "@/features/landingArticles/labels";
import { GuideCategoryRegistrar } from "@/features/landingArticles/GuideCategoryRegistrar";
import { LOCALE_LABELS } from "@/features/navigation/LanguageSwitcher";
import type { Locale } from "@/shared/i18n/locale";
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildFaqPageJsonLd } from "@/shared/seo/articleJsonLd";

export async function ArticleDetailView({ locale, article }: { locale: string; article: LandingArticle }) {
  const session = await getCurrentSession();
  const user = session ? await authContainer.getMeUseCase.execute({ userId: session.sub }) : null;
  const subscription = session
    ? await subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub })
    : null;

  const labels = getLandingArticleLabels(locale);

  // 이 주제(slug)가 실제로 발행된 언어만 링크로 보여준다 -- 아직 번역 안 된
  // 언어까지 링크로 걸면 404로 이어진다. hreflang(<head> 메타)은 검색엔진용,
  // 이건 사람이 직접 누를 수 있는 화면상의 언어 전환 링크.
  const availableLocales = await landingArticlesContainer.listAvailableLocalesUseCase.execute({ slug: article.slug });

  const faqJsonLd = buildFaqPageJsonLd(article);
  // 로그인 상태면 무조건 /projects로, 아니면 회원가입->(신규면 consent,
  // 기존 계정이면 콜백에서 그대로) /projects로 도착하도록 유도한다 -- 각
  // 글의 content.ctaHref는 더 이상 이동 목적지로 쓰지 않고, 버튼 문구
  // (content.ctaLabel)만 그대로 존중한다.
  const startHref = user ? "/projects" : "/register?redirect=%2Fprojects";

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildArticleJsonLd(locale, article)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(locale, article)) }}
      />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <GuideCategoryRegistrar category={article.category} />
      {user ? (
        <AppHeader user={{ email: user.email, name: user.name }} planCode={subscription?.planCode ?? "free"} />
      ) : (
        <Header user={null} planCode={null} />
      )}

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {article.category === "style" || article.category === "faq" ? (
              <Link
                href={
                  article.category === "faq"
                    ? guidesHubHrefForCategory(locale, "faq")
                    : guidesHubHref(locale)
                }
                className="text-sm text-muted underline underline-offset-4"
              >
                {labels.backToHub}
              </Link>
            ) : (
              <span />
            )}
            {availableLocales.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {availableLocales.map((loc) => (
                  <Link
                    key={loc}
                    href={guideDetailHref(loc, article.slug)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      loc === locale ? "border-ink bg-ink text-paper" : "border-line text-muted hover:border-ink hover:text-ink"
                    }`}
                  >
                    {LOCALE_LABELS[loc as Locale] ?? loc}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{article.title}</h1>
        </div>

        {article.category === "faq" ? (
          <FaqBody content={article.content as FaqArticleContent} locale={locale} labels={labels} startHref={startHref} />
        ) : article.category === "why-aster" ? (
          <WhyAsterBody content={article.content as WhyAsterPageContent} startHref={startHref} />
        ) : (
          <StyleGuideBody content={article.content as StyleGuideContent} locale={locale} labels={labels} startHref={startHref} />
        )}
      </main>

      <Footer />
    </div>
  );
}

function FaqBody({
  content,
  locale,
  labels,
  startHref,
}: {
  content: FaqArticleContent;
  locale: string;
  labels: ReturnType<typeof getLandingArticleLabels>;
  startHref: string;
}) {
  return (
    <>
      <p className="-mt-8 text-lg text-muted">{content.summary}</p>

      {content.images.length > 0 && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {content.images.map((image, index) => (
            <div key={`${image.url}-${index}`} className="relative aspect-[4/3] w-full">
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="rounded-2xl border border-line object-cover shadow-soft"
              />
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-4 text-sm text-muted">
        {content.body.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </section>

      {content.table && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">{content.table.caption}</h2>
          <div className="overflow-x-auto rounded-2xl border border-line shadow-soft">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-surface">
                  {content.table.headers.map((header, index) => (
                    <th key={index} className="border-b border-line px-4 py-3 font-medium text-ink">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 1 ? "bg-surface/50" : undefined}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border-b border-line px-4 py-3 text-muted">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {content.keyPoints.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">{labels.keyPointsHeading}</h2>
          <dl className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface shadow-soft">
            {content.keyPoints.map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex flex-col gap-1 px-5 py-4">
                <dt className="text-sm font-medium text-ink">{item.label}</dt>
                <dd className="text-sm text-muted">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {content.relatedQuestions.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">{labels.relatedQuestionsHeading}</h2>
          <div className="flex flex-wrap gap-2">
            {content.relatedQuestions.map((q) => (
              <Link
                key={q.slug}
                href={guideDetailHref(locale, q.slug)}
                className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-[var(--color-gold)] hover:text-ink"
              >
                {q.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex justify-center">
        <Link
          href={startHref}
          className="rounded-full bg-ink px-8 py-3 text-center text-sm text-paper transition hover:opacity-90"
        >
          {content.ctaLabel}
        </Link>
      </section>
    </>
  );
}

function WhyAsterBody({ content, startHref }: { content: WhyAsterPageContent; startHref: string }) {
  return (
    <>
      <p className="-mt-8 text-lg text-muted">{content.intro}</p>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {content.benefits.map((benefit, index) => (
          <div key={`${benefit.title}-${index}`} className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
            <h2 className="font-semibold">{benefit.title}</h2>
            <p className="mt-2 text-sm text-muted">{benefit.description}</p>
          </div>
        ))}
      </section>
      <section className="flex justify-center">
        <Link
          href={startHref}
          className="rounded-full bg-ink px-8 py-3 text-center text-sm text-paper transition hover:opacity-90"
        >
          {content.ctaLabel}
        </Link>
      </section>
    </>
  );
}

function StyleGuideBody({
  content,
  locale,
  labels,
  startHref,
}: {
  content: StyleGuideContent;
  locale: string;
  labels: ReturnType<typeof getLandingArticleLabels>;
  startHref: string;
}) {
  return (
    <>
      <p className="-mt-8 text-lg text-muted">{content.definition}</p>

      {content.images.length > 0 && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {content.images.map((image, index) => (
            <div key={`${image.url}-${index}`} className="relative aspect-[4/3] w-full">
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="rounded-2xl border border-line object-cover shadow-soft"
              />
            </div>
          ))}
        </section>
      )}

      {content.industryFit.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">{labels.industryFitHeading}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {content.industryFit.map((item, index) => (
              <div key={`${item.industry}-${index}`} className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
                <p className="font-medium">{item.industry}</p>
                <p className="mt-1 text-sm text-muted">{item.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.detailSpec.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">{labels.detailSpecHeading}</h2>
          <dl className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface shadow-soft">
            {content.detailSpec.map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex flex-col gap-1 px-5 py-4">
                <dt className="text-sm font-medium text-ink">{item.label}</dt>
                <dd className="text-sm text-muted">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {content.combos.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">{labels.combosHeading}</h2>
          <div className="flex flex-wrap gap-2">
            {content.combos.map((combo) => (
              <Link
                key={combo.slug}
                href={guideDetailHref(locale, combo.slug)}
                className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-[var(--color-gold)] hover:text-ink"
              >
                {combo.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {content.faq.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">{labels.faqHeading}</h2>
          <div className="flex flex-col gap-3">
            {content.faq.map((item, index) => (
              <details
                key={`${item.question}-${index}`}
                className="rounded-2xl border border-line bg-surface p-4 shadow-soft"
              >
                <summary className="cursor-pointer font-medium">{item.question}</summary>
                <p className="mt-2 text-sm text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="flex justify-center">
        <Link
          href={startHref}
          className="rounded-full bg-ink px-8 py-3 text-center text-sm text-paper transition hover:opacity-90"
        >
          {content.ctaLabel}
        </Link>
      </section>
    </>
  );
}
