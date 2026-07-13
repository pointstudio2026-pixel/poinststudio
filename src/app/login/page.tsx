import Link from "next/link";
import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-xl font-semibold">로그인</h1>
      <LoginForm />
      <p className="text-sm text-neutral-500">
        계정이 없으신가요?{" "}
        <Link href="/register" className="underline">
          회원가입
        </Link>
      </p>
    </main>
  );
}
