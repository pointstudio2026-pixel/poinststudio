"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmail } from "@/services/auth-service";
import { Spinner } from "@/components/Spinner";

type Status = "verifying" | "success" | "error";

export function VerifyEmailView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(() => (token ? "verifying" : "error"));
  const [errorMessage, setErrorMessage] = useState<string | null>(() =>
    token ? null : "인증 링크가 올바르지 않습니다.",
  );

  useEffect(() => {
    if (!token) return;
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "인증에 실패했습니다.");
      });
  }, [token]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
      {status === "verifying" && (
        <>
          <Spinner />
          <p className="text-sm text-neutral-500">이메일을 인증하는 중입니다...</p>
        </>
      )}

      {status === "success" && (
        <>
          <h1 className="text-lg font-semibold">이메일이 인증되었습니다.</h1>
          <Link href="/projects" className="mt-2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white">
            내 프로젝트로 이동
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-lg font-semibold text-red-600">인증에 실패했습니다.</h1>
          <p className="text-sm text-neutral-500">{errorMessage}</p>
          <Link href="/projects" className="mt-2 text-sm underline">
            내 프로젝트로 이동해서 재발송 요청하기
          </Link>
        </>
      )}
    </main>
  );
}
