"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
} from "@/modules/auth/schemas/auth.schemas";
import { updateProfile, changePassword } from "@/services/auth-service";
import { Spinner } from "@/components/Spinner";
import { AppHeader } from "@/features/navigation/AppHeader";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

const changePasswordFormSchema = changePasswordSchema
  .extend({ confirmPassword: z.string().min(1, "새 비밀번호를 다시 입력해주세요.") })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "새 비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });
type ChangePasswordFormInput = z.infer<typeof changePasswordFormSchema>;

export function MyInfoView({
  email,
  initialName,
  hasPassword,
  planCode,
}: {
  email: string;
  initialName: string | null;
  hasPassword: boolean;
  planCode: PlanCode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <AppHeader user={{ email, name: initialName }} planCode={planCode} />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">내 정보</h1>

      <section className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4">
        <p className="text-sm text-neutral-500">이메일</p>
        <p className="text-sm font-medium">{email}</p>
      </section>

      <ProfileNameForm initialName={initialName} />

      {hasPassword ? (
        <PasswordChangeForm />
      ) : (
        <section className="rounded-lg border border-neutral-200 p-4">
          <h2 className="font-medium">비밀번호</h2>
          <p className="mt-2 text-sm text-neutral-500">
            소셜 로그인 계정은 비밀번호가 설정되어 있지 않습니다.
          </p>
        </section>
      )}
      </main>
    </div>
  );
}

function ProfileNameForm({ initialName }: { initialName: string | null }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: initialName ?? "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSuccessMessage(null);
    try {
      await updateProfile(values);
      setSuccessMessage("이름이 변경되었습니다.");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "이름 변경에 실패했습니다.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
      <h2 className="font-medium">이름</h2>
      <div className="flex flex-col gap-1">
        <input
          id="name"
          type="text"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-900"
          {...register("name")}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      {successMessage && <p className="text-sm text-green-700">{successMessage}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-fit items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting && <Spinner />}
        {isSubmitting ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}

function PasswordChangeForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormInput>({ resolver: zodResolver(changePasswordFormSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSuccessMessage(null);
    try {
      await changePassword(values);
      reset();
      setSuccessMessage("비밀번호가 변경되었습니다.");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
      <h2 className="font-medium">비밀번호 변경</h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="currentPassword" className="text-sm text-neutral-500">
          현재 비밀번호
        </label>
        <input
          id="currentPassword"
          type="password"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-900"
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <p className="text-sm text-red-600">{errors.currentPassword.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="newPassword" className="text-sm text-neutral-500">
          새 비밀번호
        </label>
        <input
          id="newPassword"
          type="password"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-900"
          {...register("newPassword")}
        />
        {errors.newPassword && <p className="text-sm text-red-600">{errors.newPassword.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm text-neutral-500">
          새 비밀번호 확인
        </label>
        <input
          id="confirmPassword"
          type="password"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-900"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      {successMessage && <p className="text-sm text-green-700">{successMessage}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-fit items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting && <Spinner />}
        {isSubmitting ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
