import Link from "next/link";
import { Header } from "@/features/landing/Header";
import { AppHeader } from "@/features/navigation/AppHeader";
import { Footer } from "@/features/landing/Footer";
import { getCurrentSession } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { BRANDING_WORKSPACE_STEPS } from "@/modules/projects/domain/Project";
import { IconLayers, IconLink, IconPalette } from "@/features/landing/icons";
import { getServerLocale } from "@/shared/i18n/serverLocale";
import { MESSAGES } from "@/shared/i18n/messages";

export default async function GuidePage() {
  const session = await getCurrentSession();
  const user = session ? await authContainer.getMeUseCase.execute({ userId: session.sub }) : null;
  const subscription = session
    ? await subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub })
    : null;

  const locale = await getServerLocale();
  const t = MESSAGES[locale].guidePage;
  const projectSteps = t.myProjects.steps;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {user ? (
        <AppHeader user={{ email: user.email, name: user.name }} planCode={subscription?.planCode ?? "free"} />
      ) : (
        <Header user={null} planCode={null} />
      )}

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-sm text-muted">{t.eyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h1>
          <p className="text-muted">{t.intro}</p>
        </div>

        <section className="shadow-soft flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-tint-blue">
              <IconLayers className="h-5 w-5 text-ink" />
            </div>
            <h2 className="text-xl font-semibold">{t.myProjects.title}</h2>
          </div>
          <p className="text-sm text-muted">{t.myProjects.loginNote}</p>
          <p className="text-muted">
            <Link href="/projects" className="underline underline-offset-4">
              {t.myProjects.descLink}
            </Link>
            {t.myProjects.descAfter}
          </p>
          <ol className="flex flex-col gap-3">
            {BRANDING_WORKSPACE_STEPS.map((step, index) => (
              <li key={step.key} className="flex items-baseline gap-3 rounded-xl border border-line bg-paper p-4">
                <span className="text-sm font-medium text-muted">{index + 1}</span>
                <span className="font-medium">{projectSteps[step.key as keyof typeof projectSteps]}</span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted">{t.myProjects.note}</p>
        </section>

        <section className="shadow-soft flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-tint-blue">
              <IconPalette className="h-5 w-5 text-ink" />
            </div>
            <h2 className="text-xl font-semibold">{t.myStyles.title}</h2>
            <span className="rounded-full bg-tint-beige px-2 py-0.5 text-xs font-medium text-ink">
              {t.myStyles.tier}
            </span>
          </div>
          <p className="text-muted">
            {t.myStyles.introBefore}
            <strong className="text-ink">{t.myStyles.introStrong}</strong>
            {t.myStyles.introAfter}
          </p>
          <ol className="flex flex-col gap-3">
            <li className="rounded-xl border border-line bg-paper p-4">
              <p className="font-medium">{t.myStyles.step1Title}</p>
              <p className="mt-1 text-sm text-muted">
                <Link href="/my-styles" className="underline underline-offset-4">
                  {t.myStyles.step1Link}
                </Link>
                {t.myStyles.step1After}
              </p>
            </li>
            <li className="rounded-xl border border-line bg-paper p-4">
              <p className="font-medium">{t.myStyles.step2Title}</p>
              <p className="mt-1 text-sm text-muted">{t.myStyles.step2Body}</p>
            </li>
            <li className="rounded-xl border border-line bg-paper p-4">
              <p className="font-medium">{t.myStyles.step3Title}</p>
              <p className="mt-1 text-sm text-muted">{t.myStyles.step3Body}</p>
            </li>
          </ol>
        </section>

        <section className="shadow-soft flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-tint-blue">
              <IconLink className="h-5 w-5 text-ink" />
            </div>
            <h2 className="text-xl font-semibold">{t.team.title}</h2>
            <span className="rounded-full bg-tint-beige px-2 py-0.5 text-xs font-medium text-ink">
              {t.team.tier}
            </span>
          </div>
          <p className="text-muted">
            {t.team.introBefore}
            <strong className="text-ink">{t.team.introStrong}</strong>
            {t.team.introAfter}
          </p>
          <ol className="flex flex-col gap-3">
            <li className="rounded-xl border border-line bg-paper p-4">
              <p className="font-medium">{t.team.step1Title}</p>
              <p className="mt-1 text-sm text-muted">
                {t.team.step1Before}
                <Link href="/team" className="underline underline-offset-4">
                  {t.team.step1Link}
                </Link>
                {t.team.step1After}
              </p>
            </li>
            <li className="rounded-xl border border-line bg-paper p-4">
              <p className="font-medium">{t.team.step2Title}</p>
              <p className="mt-1 text-sm text-muted">{t.team.step2Body}</p>
            </li>
            <li className="rounded-xl border border-line bg-paper p-4">
              <p className="font-medium">{t.team.step3Title}</p>
              <p className="mt-1 text-sm text-muted">{t.team.step3Body}</p>
            </li>
          </ol>
        </section>
      </main>

      <Footer />
    </div>
  );
}
