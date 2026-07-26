"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmail } from "@/services/auth-service";
import { Spinner } from "@/components/Spinner";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

type Status = "verifying" | "success" | "error";

export function VerifyEmailView() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(() => (token ? "verifying" : "error"));
  const [errorMessage, setErrorMessage] = useState<string | null>(() =>
    token ? null : t("verifyEmail.invalidLink"),
  );

  useEffect(() => {
    if (!token) return;
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : t("verifyEmail.failed"));
      });
  }, [token, t]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
      {status === "verifying" && (
        <>
          <Spinner />
          <p className="text-sm text-muted">{t("verifyEmail.verifying")}</p>
        </>
      )}

      {status === "success" && (
        <>
          <h1 className="text-lg font-semibold">{t("verifyEmail.success")}</h1>
          <Link href="/projects" className="mt-2 rounded-full bg-ink px-4 py-2 text-sm text-paper">
            {t("verifyEmail.goToProjects")}
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-lg font-semibold text-red-600">{t("verifyEmail.failed")}</h1>
          <p className="text-sm text-muted">{errorMessage}</p>
          <Link href="/projects" className="mt-2 text-sm underline">
            {t("verifyEmail.goToProjectsResend")}
          </Link>
        </>
      )}
    </main>
  );
}
