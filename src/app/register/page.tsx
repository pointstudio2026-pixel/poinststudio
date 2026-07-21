import Link from "next/link";
import { RegisterForm } from "@/features/auth/RegisterForm";
import { OAuthButtons } from "@/features/auth/OAuthButtons";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-paper p-8">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        ASTER.
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8">
        <p className="eyebrow text-sm text-muted">Get started</p>
        <h1 className="mt-1 text-xl font-semibold">회원가입</h1>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <div className="mt-6">
          <OAuthButtons intent="register" />
        </div>
      </div>
      <p className="text-sm text-muted">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-ink underline underline-offset-4">
          로그인
        </Link>
      </p>
    </main>
  );
}
