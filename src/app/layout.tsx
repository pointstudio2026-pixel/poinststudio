import type { Metadata } from "next";
import "./globals.css";
import { SessionBootstrap } from "@/features/auth/SessionBootstrap";

export const metadata: Metadata = {
  title: "ASTER",
  description: "Design Begins with Direction.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <SessionBootstrap />
        {children}
      </body>
    </html>
  );
}
