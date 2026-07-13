"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/modules/auth/schemas/auth.schemas";
import { loginUser } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";
import { Spinner } from "@/components/Spinner";

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const { user } = await loginUser(values);
      setUser(user);
      router.push("/dashboard");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          이메일
        </label>
        <input
          id="email"
          type="email"
          className="rounded-md border border-neutral-300 px-3 py-2"
          {...register("email")}
        />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          className="rounded-md border border-neutral-300 px-3 py-2"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting && <Spinner />}
        {isSubmitting ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
