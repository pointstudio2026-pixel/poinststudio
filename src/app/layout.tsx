import type { Metadata } from "next";
import { Fraunces, Gowun_Batang } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SessionBootstrap } from "@/features/auth/SessionBootstrap";
import { getServerLocale } from "@/shared/i18n/serverLocale";
import { MESSAGES } from "@/shared/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    metadataBase: new URL("https://www.designaster.com"),
    title: MESSAGES[locale].meta.title,
    description: MESSAGES[locale].meta.description,
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
