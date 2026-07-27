import type { Metadata } from "next";
import { Fraunces, Gowun_Batang } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SessionBootstrap } from "@/features/auth/SessionBootstrap";
import { getServerLocale } from "@/shared/i18n/serverLocale";
import { MESSAGES } from "@/shared/i18n/messages";

// Open Graph의 locale 값(og:locale)은 Next.js Metadata API가 요구하는
// BCP47 코드(ko/en/ja/fr/de)가 아니라 "ko_KR" 같은 언더스코어 표기라 별도 매핑이 필요하다.
const OG_LOCALE: Record<string, string> = { ko: "ko_KR", en: "en_US", ja: "ja_JP", fr: "fr_FR", de: "de_DE" };

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const title = MESSAGES[locale].meta.title;
  const description = MESSAGES[locale].meta.description;
  return {
    metadataBase: new URL("https://www.designaster.com"),
    title,
    description,
    openGraph: {
      title,
      description,
      url: "https://www.designaster.com",
      siteName: "ASTER",
      locale: OG_LOCALE[locale] ?? "ko_KR",
      type: "website",
      images: [{ url: "/brand/aster-og.png", width: 1200, height: 630, alt: "ASTER" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/brand/aster-og.png"],
    },
    other: {
      "naver-site-verification": "1e705549ff65b5ca17687ce1f6cf2d2891b00262",
    },
  };
}

// 홈페이지 헤드라인 전용 에디토리얼 세리프 -- 라틴 문자는 Fraunces, 한글은
// Gowun Batang이 담당한다(폴백 체인으로 연결, .font-display 참고). 다른
// 화면은 이 변수를 참조하는 클래스가 없으므로 시각적으로 영향받지 않는다.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});
const gowunBatang = Gowun_Batang({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-gowun-batang",
  display: "swap",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getServerLocale();
  return (
    <html lang={locale} className={`${fraunces.variable} ${gowunBatang.variable}`}>
      <body>
        <Providers initialLocale={locale}>
          <SessionBootstrap />
          {children}
        </Providers>
      </body>
    </html>
  );
}
