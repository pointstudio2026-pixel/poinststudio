import Link from "next/link";
import { Header } from "@/features/landing/Header";
import { AppHeader } from "@/features/navigation/AppHeader";
import { Footer } from "@/features/landing/Footer";
import { getCurrentSession } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import type { LandingArticle } from "@/modules/landingArticles/domain/LandingArticle";
import { guideDetailHref, guidesHubHref } from "@/features/landingArticles/routing";
import { getLandingArticleLabels } from "@/features/landingArticles/labels";

export async function ArticleDetailView({ locale, article }: { locale: string; article: LandingArticle }) {
  const session = await getCurrentSession();
  const user = session ? await authContainer.getMeUseCase.execute({ userId: session.sub }) : null;
  const subscription = session
    ? await subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub })
    : null;

  const labels = getLandingArticleLabels(locale);
  const { content } = article;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {user ? (
        <AppHeader user={{ email: user.email, name: user.name }} planCode={subscription?.planCode ?? "free"} />
      ) : (
        <Header user={null} planCode={null} />
      )}

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-4">
          <Link href={guidesHubHref(locale)} className="text-sm text-muted underline underline-offset-4">
            {labels.backToHub}
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{article.title}</h1>
          <p className="text-lg text-muted">{content.definition}</p>
        </div>

        {content.images.length > 0 && (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {content.images.map((image, index) => (
              <img
                key={`${image.url}-${index}`}
                src={image.url}
                alt={image.alt}
                className="w-full rounded-2xl border border-line object-cover shadow-soft"
              />
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
                <div key={`${item.label}-${index}`} className="flex items-baseline justify-between gap-4 px-5 py-3">
                  <dt className="text-sm text-muted">{item.label}</dt>
                  <dd className="text-right font-medium">{item.value}</dd>
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
            href={content.ctaHref}
            className="rounded-full bg-ink px-8 py-3 text-center text-sm text-paper transition hover:opacity-90"
          >
            {content.ctaLabel}
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
