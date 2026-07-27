import Link from "next/link";
import { Header } from "@/features/landing/Header";
import { AppHeader } from "@/features/navigation/AppHeader";
import { Footer } from "@/features/landing/Footer";
import { getCurrentSession } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { landingArticlesContainer } from "@/modules/landingArticles/container";
import { guideDetailHref } from "@/features/landingArticles/routing";
import { getLandingArticleLabels } from "@/features/landingArticles/labels";
import { GuideCategoryRegistrar } from "@/features/landingArticles/GuideCategoryRegistrar";
import type { StyleGuideContent } from "@/modules/landingArticles/domain/LandingArticle";

// 이 허브는 카테고리별 둘러보기 화면을 겸한다 -- 기본값은 "스타일 가이드
// 둘러보기"(style)이고, ?category=faq로 들어오면 FAQ 게시글 목록을 같은
// 화면 구조로 보여준다. Why ASTER 페이지는 단독 페이지라 여기 목록에 섞이지
// 않는다(카테고리 자체가 이 상수와 무관).
const DEFAULT_CATEGORY = "style";

export async function ArticleHubView({ locale, category }: { locale: string; category?: string }) {
  const session = await getCurrentSession();
  const user = session ? await authContainer.getMeUseCase.execute({ userId: session.sub }) : null;
  const subscription = session
    ? await subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub })
    : null;

  const labels = getLandingArticleLabels(locale);
  const requestedCategory = category ?? DEFAULT_CATEGORY;
  const isFaqHub = requestedCategory === "faq";
  const articles = await landingArticlesContainer.listLandingArticlesUseCase.execute({
    locale,
    category: requestedCategory,
  });
  const categories = Array.from(new Set(articles.map((a) => a.category)));

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <GuideCategoryRegistrar category={isFaqHub ? "faq" : null} />
      {user ? (
        <AppHeader user={{ email: user.email, name: user.name }} planCode={subscription?.planCode ?? "free"} />
      ) : (
        <Header user={null} planCode={null} />
      )}

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-sm text-muted">{isFaqHub ? labels.faqHubEyebrow : labels.hubEyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {isFaqHub ? labels.faqHubTitle : labels.hubTitle}
          </h1>
          <p className="max-w-2xl text-muted">{isFaqHub ? labels.faqHubIntro : labels.hubIntro}</p>
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={guidesHubHrefWithCategory(locale)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                !category ? "border-ink bg-ink text-paper" : "border-line text-muted hover:text-ink"
              }`}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={guidesHubHrefWithCategory(locale, c)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  category === c ? "border-ink bg-ink text-paper" : "border-line text-muted hover:text-ink"
                }`}
              >
                {c}
              </Link>
            ))}
          </div>
        )}

        {articles.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted shadow-soft">
            {labels.hubEmpty}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              if (article.category === "faq") {
                return (
                  <Link
                    key={article.slug}
                    href={guideDetailHref(locale, article.slug)}
                    className="shadow-soft flex flex-col rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <h2 className="text-lg font-semibold">{article.displayTitle}</h2>
                  </Link>
                );
              }
              const content = article.content as StyleGuideContent;
              const thumbnail = content.images?.[0];
              return (
                <Link
                  key={article.slug}
                  href={guideDetailHref(locale, article.slug)}
                  className="shadow-soft flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {thumbnail ? (
                    <img
                      src={thumbnail.url}
                      alt={thumbnail.alt}
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-video w-full bg-tint-blue" />
                  )}
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <h2 className="text-lg font-semibold">{article.displayTitle}</h2>
                    <p className="line-clamp-2 text-sm text-muted">{content.definition}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function guidesHubHrefWithCategory(locale: string, category?: string): string {
  const base = locale === "ko" ? "/guides" : `/${locale}/guides`;
  return category ? `${base}?category=${encodeURIComponent(category)}` : base;
}
