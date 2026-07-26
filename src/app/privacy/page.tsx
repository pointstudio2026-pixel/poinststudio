import Link from "next/link";
import { getServerLocale } from "@/shared/i18n/serverLocale";
import { MESSAGES } from "@/shared/i18n/messages";

export default async function PrivacyPage() {
  const locale = await getServerLocale();
  const t = MESSAGES[locale].privacyPolicy;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start gap-6 px-8 py-24">
      <Link href="/" className="text-sm text-muted underline underline-offset-4">
        ← {t.backToHome}
      </Link>
      <div>
        <h1 className="text-3xl font-semibold">{t.title}</h1>
        <p className="mt-2 text-sm text-muted">{t.effectiveDate}</p>
      </div>

      <div className="w-full rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
        <p className="font-medium text-ink">{t.summary.heading}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t.summary.item1}</li>
          <li>{t.summary.item2}</li>
          <li>{t.summary.item3}</li>
          <li>{t.summary.item4}</li>
          <li>{t.summary.item5}</li>
        </ul>
      </div>

      <Section title={t.section1.title}>
        <p className="font-medium text-ink">{t.section1.signupHeading}</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>{t.section1.signupItem1}</li>
          <li>{t.section1.signupItem2}</li>
        </ul>
        <p className="mt-3 font-medium text-ink">{t.section1.usageHeading}</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>{t.section1.usageItem1}</li>
          <li>{t.section1.usageItem2}</li>
          <li>{t.section1.usageItem3}</li>
        </ul>
      </Section>

      <Section title={t.section2.title}>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t.section2.item1}</li>
          <li>{t.section2.item2}</li>
          <li>{t.section2.item3}</li>
          <li>{t.section2.item4}</li>
          <li>{t.section2.item5}</li>
        </ul>
      </Section>

      <Section title={t.section3.title}>
        <p>{t.section3.intro}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t.section3.item1}</li>
          <li>{t.section3.item2}</li>
          <li>{t.section3.item3}</li>
          <li>{t.section3.item4}</li>
        </ul>
        <p className="mt-2">{t.section3.outro}</p>
      </Section>

      <Section title={t.section4.title}>
        <p>{t.section4.intro}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t.section4.item1}</li>
          <li>{t.section4.item2}</li>
        </ul>
      </Section>

      <Section title={t.section5.title}>
        <p>
          {t.section5.bodyBefore}
          <Link href="/support" className="underline underline-offset-4">
            {t.section5.contactLink}
          </Link>
          {t.section5.bodyAfter}
        </p>
      </Section>

      <Section title={t.section6.title}>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t.section6.item1}</li>
          <li>{t.section6.item2}</li>
          <li>{t.section6.item3}</li>
        </ul>
      </Section>

      <Section title={t.section7.title}>
        <p>{t.section7.body}</p>
      </Section>

      <Section title={t.section8.title}>
        <p>
          {t.section8.bodyBefore}
          <Link href="/support" className="underline underline-offset-4">
            {t.section8.contactLink}
          </Link>
          {t.section8.bodyAfter}
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
