"use client";

import { useState } from "react";
import { resendVerificationEmail } from "@/services/auth-service";

export function EmailVerificationBanner({ emailVerified }: { emailVerified: boolean }) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (emailVerified) return null;

  async function handleResend() {
    setIsSending(true);
    setError(null);
    try {
      await resendVerificationEmail();
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "재발송에 실패했습니다.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-8 py-2.5 text-sm text-amber-900">
      <span>
        이메일 인증이 필요합니다 · 이미지 생성 전에 가입하신 이메일의 인증 링크를
        클릭해주세요.
        {sent && " (인증 메일을 다시 보냈습니다)"}
        {error && ` (${error})`}
      </span>
      <button
        type="button"
        onClick={handleResend}
        disabled={isSending || sent}
        className="rounded-full border border-amber-300 px-3 py-1 text-xs transition hover:border-amber-500 disabled:opacity-50"
      >
        {isSending ? "발송 중..." : sent ? "발송됨" : "인증 메일 재발송"}
      </button>
    </div>
  );
}
