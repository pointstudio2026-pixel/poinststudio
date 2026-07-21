import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OAUTH_PENDING_SIGNUP_COOKIE } from "@/shared/auth/cookies";
import { verifyOAuthPendingSignupToken } from "@/shared/auth/jwt";
import { OAuthConsentForm } from "@/features/auth/OAuthConsentForm";

const PROVIDER_LABEL: Record<string, string> = { google: "Google", kakao: "Kakao" };

export default async function OAuthConsentPage() {
  const store = await cookies();
  const token = store.get(OAUTH_PENDING_SIGNUP_COOKIE)?.value;
  if (!token) {
    redirect("/login?oauthError=invalid_request");
  }

  let email: string;
  let providerLabel: string;
  try {
    const pending = verifyOAuthPendingSignupToken(token);
    email = pending.email;
    providerLabel = PROVIDER_LABEL[pending.provider] ?? pending.provider;
  } catch {
    redirect("/login?oauthError=invalid_request");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-paper p-8">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        ASTER.
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8">
        <p className="eyebrow text-sm text-muted">Almost there</p>
        <h1 className="mt-1 text-xl font-semibold">회원가입 완료하기</h1>
        <p className="mt-3 text-sm text-muted">
          {providerLabel} 계정({email})으로 ASTER에 가입합니다. 약관에 동의하면 가입이 완료됩니다.
        </p>
        <div className="mt-6">
          <OAuthConsentForm />
        </div>
      </div>
    </main>
  );
}
