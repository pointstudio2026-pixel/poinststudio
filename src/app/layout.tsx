import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SessionBootstrap } from "@/features/auth/SessionBootstrap";
import { getServerLocale } from "@/shared/i18n/serverLocale";

export const metadata: Metadata = {
  title: "ASTER",
  description: "브랜드의 방향성에서 디자인이 시작됩니다.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getServerLocale();
  return (
    <html lang={locale}>
      <body>
        <Providers initialLocale={locale}>
          <SessionBootstrap />
          {children}
        </Providers>
      </body>
    </html>
  );
}
