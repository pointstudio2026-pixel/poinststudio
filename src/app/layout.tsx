import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SessionBootstrap } from "@/features/auth/SessionBootstrap";

export const metadata: Metadata = {
  title: "ASTER",
  description: "브랜드의 방향성에서 디자인이 시작됩니다.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <SessionBootstrap />
          {children}
        </Providers>
      </body>
    </html>
  );
}
