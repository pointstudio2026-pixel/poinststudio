"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/modules/auth/schemas/auth.schemas";
import { registerUser } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";
import { Spinner } from "@/components/Spinner";

export function RegisterForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const { user } = await registerUser(values);
      setUser(user);
      router.push("/projects");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-ink">
          이름 (선택)
        </label>
        <input
          id="name"
          type="text"
          className="rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-ink"
          {...register("name")}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          이메일
        </label>
        <input
          id="email"
          type="email"
          className="rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-ink"
          {...register("email")}
        />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          className="rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-ink"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" className="mt-0.5" {...register("agreedToTerms")} />
          <span>
            <Link href="/terms" target="_blank" className="underline underline-offset-4">
              이용약관
            </Link>{" "}
            및{" "}
            <Link href="/privacy" target="_blank" className="underline underline-offset-4">
              개인정보처리방침
            </Link>
            에 동의합니다.
          </span>
        </label>
        {errors.agreedToTerms && <p className="text-sm text-red-600">{errors.agreedToTerms.message}</p>}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm text-paper transition hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting && <Spinner />}
        {isSubmitting ? "가입 중..." : "회원가입"}
      </button>
    </form>
  );
}
