import Link from "next/link";
import { getServerLocale } from "@/shared/i18n/serverLocale";
import { MESSAGES } from "@/shared/i18n/messages";

export default async function TermsPage() {
  const locale = await getServerLocale();
  const t = MESSAGES[locale].termsOfService;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start gap-6 px-8 py-24">
      <Link href="/" className="text-sm text-muted underline underline-offset-4">
        {t.backToHome}
      </Link>
      <div>
        <h1 className="text-3xl font-semibold">{t.title}</h1>
        <p className="mt-2 text-sm text-muted">{t.effectiveDate}</p>
      </div>

      <div className="w-full rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
        <p className="font-medium text-ink">{t.summary.title}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t.summary.item1}</li>
          <li>{t.summary.item2}</li>
          <li>{t.summary.item3}</li>
          <li>{t.summary.item4}</li>
          <li>{t.summary.item5}</li>
        </ul>
      </div>

      <Section title={t.article1.title}>
        <p>{t.article1.body}</p>
      </Section>

      <Section title={t.article2.title}>
        <p>{t.article2.intro}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t.article2.item1}</li>
          <li>{t.article2.item2}</li>
          <li>{t.article2.item3}</li>
          <li>{t.article2.item4}</li>
        </ul>
        <p className="mt-2">{t.article2.outro}</p>
      </Section>

      <Section title={t.article3.title}>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t.article3.item1}</li>
          <li>{t.article3.item2}</li>
          <li>{t.article3.item3}</li>
          <li>{t.article3.item4}</li>
        </ul>
      </Section>

      <Section title={t.article4.title}>
        <p>
          {t.article4.body1Before}
          <Link href="/privacy" className="underline underline-offset-4">
            {t.article4.body1Link}
          </Link>
          {t.article4.body1After}
        </p>
        <p className="mt-2">{t.article4.body2}</p>
      </Section>

      <Section title={t.article5.title}>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t.article5.item1}</li>
          <li>{t.article5.item2}</li>
          <li>{t.article5.item3}</li>
        </ul>
      </Section>

      <Section title={t.article6.title}>
        <p>{t.article6.intro}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t.article6.item1}</li>
          <li>{t.article6.item2}</li>
          <li>{t.article6.item3}</li>
          <li>{t.article6.item4}</li>
        </ul>
      </Section>

      <Section title={t.article7.title}>
        <p>
          {t.article7.bodyBefore}
          <Link href="/support" className="underline underline-offset-4">
            {t.article7.bodyLink}
          </Link>
          {t.article7.bodyAfter}
        </p>
      </Section>

      <Section title={t.article8.title}>
        <p>{t.article8.body}</p>
      </Section>

      <Section title={t.article9.title}>
        <p>{t.article9.body}</p>
      </Section>

      <Section title={t.article10.title}>
        <p>{t.article10.body}</p>
      </Section>

      <Section title={t.article11.title}>
        <p>
          {t.article11.bodyBefore}
          <Link href="/support" className="underline underline-offset-4">
            {t.article11.bodyLink}
          </Link>
          {t.article11.bodyAfter}
        </p>
      </Section>

      <p className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        {t.disclaimer}
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="w-full">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}
