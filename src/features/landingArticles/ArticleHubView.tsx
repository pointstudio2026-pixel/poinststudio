import Link from "next/link";
import { Header } from "@/features/landing/Header";
import { AppHeader } from "@/features/navigation/AppHeader";
import { Footer } from "@/features/landing/Footer";
import { getCurrentSession } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { landingArticlesContainer } from "@/modules/landingArticles/container";
import { guideDetailHref, guidesHubHref, guidesHubHrefForCategory } from "@/features/landingArticles/routing";
import { getLandingArticleLabels } from "@/features/landingArticles/labels";
import { getCategoryMeta } from "@/features/landingArticles/categoryMeta";
import { GuideCategoryRegistrar } from "@/features/landingArticles/GuideCategoryRegistrar";
import type { LandingArticle, StyleGuideContent } from "@/modules/landingArticles/domain/LandingArticle";

// "faq"는 이 허브(카테고리 디렉터리 + 카테고리별 목록)에 의도적으로 안
// 나온다 -- 성격이 다른 단독 진입점(네비게이션의 FAQ 메뉴)으로만 접근하며,
// ?category=faq로 들어왔을 때만 예외적으로 같은 화면 구조를 재사용한다.
const HIDDEN_FROM_DIRECTORY = new Set(["faq"]);

export async function ArticleHubView({
  locale,
  category,
  query,
}: {
  locale: string;
  category?: string;
  query?: string;
}) {
  const session = await getCurrentSession();
  const user = session ? await authContainer.getMeUseCase.execute({ userId: session.sub }) : null;
  const subscription = session
    ? await subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub })
    : null;

  const labels = getLandingArticleLabels(locale);
  const trimmedQuery = query?.trim();

  const layout = (children: React.ReactNode) => (
    <div className="flex min-h-screen flex-col bg-paper">
      <GuideCategoryRegistrar category={category === "faq" ? "faq" : null} />
      {user ? (
        <AppHeader user={{ email: user.email, name: user.name }} planCode={subscription?.planCode ?? "free"} />
      ) : (
        <Header user={null} planCode={null} />
      )}
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-16 sm:px-8 sm:py-24">{children}</main>
      <Footer />
    </div>
  );

  const searchBox = (
    <form action={guidesHubHref(locale)} method="GET" className="flex w-full max-w-md gap-2">
      <input
        type="text"
        name="q"
        defaultValue={trimmedQuery ?? ""}
        placeholder={labels.searchPlaceholder}
        className="w-full rounded-full border border-line bg-surface px-4 py-2 text-sm outline-none focus:border-ink"
      />
      <button
        type="submit"
        className="flex-shrink-0 rounded-full bg-ink px-5 py-2 text-sm text-paper transition hover:opacity-90"
      >
        {labels.searchButton}
      </button>
    </form>
  );

  // 검색어가 있으면 카테고리와 무관하게 전체 발행 글(FAQ 포함)을 대상으로
  // 검색한다 -- 카테고리 필터/디렉터리보다 우선한다.
  if (trimmedQuery) {
    const results = await landingArticlesContainer.searchLandingArticlesUseCase.execute({
      locale,
      query: trimmedQuery,
    });
    return layout(
      <>
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-sm text-muted">{labels.hubEyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {labels.searchResultsFor}
            {trimmedQuery}
          </h1>
        </div>
        {searchBox}
        {results.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted shadow-soft">
            {labels.searchEmpty}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((article) => (
              <Link
                key={article.slug}
                href={guideDetailHref(locale, article.slug)}
                className="shadow-soft flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="w-fit rounded-full bg-tint-beige px-2 py-0.5 text-xs font-medium text-ink">
                  {getCategoryMeta(article.category, locale).label}
                </span>
                <h2 className="text-lg font-semibold">{article.displayTitle}</h2>
              </Link>
            ))}
          </div>
        )}
      </>,
    );
  }

  // 카테고리 없이 들어오면(디렉터리 화면), 존재하는 모든 카테고리를 한 번의
  // 조회로 파악해서 타일로 보여준다 -- category별로 매번 다시 조회하지
  // 않고, 이미 가져온 전체 목록을 그때그때 메모리에서 필터링한다.
  const allArticles = await landingArticlesContainer.listLandingArticlesUseCase.execute({ locale });

  if (!category) {
    const counts = new Map<string, number>();
    for (const article of allArticles) {
      if (HIDDEN_FROM_DIRECTORY.has(article.category)) continue;
      counts.set(article.category, (counts.get(article.category) ?? 0) + 1);
    }
    const tiles = Array.from(counts.entries());

    return layout(
      <>
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-sm text-muted">{labels.hubEyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{labels.hubTitle}</h1>
          <p className="max-w-2xl text-muted">{labels.hubIntro}</p>
        </div>
        {searchBox}
        {tiles.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted shadow-soft">
            {labels.hubEmpty}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map(([slug, count]) => {
              const meta = getCategoryMeta(slug, locale);
              return (
                <Link
                  key={slug}
                  href={guidesHubHrefForCategory(locale, slug)}
                  className="shadow-soft flex flex-col gap-2 rounded-2xl border border-line bg-surface p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <h2 className="text-xl font-semibold">{meta.label}</h2>
                  {meta.description && <p className="text-sm text-muted">{meta.description}</p>}
                  <p className="text-xs text-muted">
                    {count}
                    {labels.guidesCountSuffix}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </>,
    );
  }

  // 카테고리가 지정된 화면(스타일/업종/작업물유형/... 또는 FAQ) -- 위에서
  // 가져온 전체 목록을 카테고리로 필터링해서 재사용한다.
  const isFaqHub = category === "faq";
  const articles = allArticles.filter((a) => a.category === category);
  const meta = getCategoryMeta(category, locale);

  return layout(
    <>
      <div className="flex flex-col gap-3">
        <Link href={guidesHubHref(locale)} className="w-fit text-sm text-muted underline underline-offset-4">
          {labels.backToCategories}
        </Link>
        <p className="eyebrow text-sm text-muted">{isFaqHub ? labels.faqHubEyebrow : labels.hubEyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {isFaqHub ? labels.faqHubTitle : meta.label}
        </h1>
        <p className="max-w-2xl text-muted">{isFaqHub ? labels.faqHubIntro : meta.description}</p>
      </div>
      {searchBox}
      {articles.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted shadow-soft">
          {labels.hubEmpty}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => renderArticleCard(article, locale))}
        </div>
      )}
    </>,
  );
}

function renderArticleCard(article: LandingArticle, locale: string) {
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
        <img src={thumbnail.url} alt={thumbnail.alt} className="aspect-video w-full object-cover" />
      ) : (
        <div className="aspect-video w-full bg-tint-blue" />
      )}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-lg font-semibold">{article.displayTitle}</h2>
        <p className="line-clamp-2 text-sm text-muted">{content.definition}</p>
      </div>
    </Link>
  );
}
