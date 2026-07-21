import Link from "next/link";
import { LoginForm } from "@/features/auth/LoginForm";
import { OAuthButtons } from "@/features/auth/OAuthButtons";
import { oauthErrorMessage } from "@/features/auth/oauthErrorMessage";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ oauthError?: string }>;
}) {
  const { oauthError } = await searchParams;
  const errorMessage = oauthErrorMessage(oauthError);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-paper p-8">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        ASTER.
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8">
        <p className="eyebrow text-sm text-muted">Welcome back</p>
        <h1 className="mt-1 text-xl font-semibold">로그인</h1>
        {errorMessage && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}
        <div className="mt-6">
          <LoginForm />
        </div>
        <div className="mt-6">
          <OAuthButtons intent="login" />
        </div>
      </div>
      <p className="text-sm text-muted">
        계정이 없으신가요?{" "}
        <Link href="/register" className="text-ink underline underline-offset-4">
          회원가입
        </Link>
      </p>
    </main>
  );
}
