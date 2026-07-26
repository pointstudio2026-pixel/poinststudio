"use client";

import { useMemo, useState } from "react";
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
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { CancelSubscriptionButton } from "@/features/subscription/CancelSubscriptionButton";

type ChangePasswordFormInput = z.infer<typeof changePasswordSchema> & {
  confirmPassword: string;
};

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
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader user={{ email, name: initialName }} planCode={planCode} />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">{t("myInfo.title")}</h1>

      <section className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <p className="text-sm text-muted">{t("myInfo.email")}</p>
        <p className="text-sm font-medium">{email}</p>
      </section>

      <ProfileNameForm initialName={initialName} />

      {hasPassword ? (
        <PasswordChangeForm />
      ) : (
        <section className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <h2 className="font-medium">{t("myInfo.passwordTitle")}</h2>
          <p className="mt-2 text-sm text-muted">
            {t("myInfo.socialLoginNoPassword")}
          </p>
        </section>
      )}

      {planCode !== "free" && (
        <section className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <h2 className="font-medium">{t("myInfo.subscriptionTitle")}</h2>
          <p className="mt-2 mb-3 text-sm text-muted">
            {t("myInfo.currentPlanLabel", { plan: PLAN_LABELS[planCode] })}
          </p>
          <CancelSubscriptionButton />
        </section>
      )}
      </main>
    </div>
  );
}

const PLAN_LABELS: Record<PlanCode, string> = { free: "Free", pro: "Pro", studio: "Studio" };

function ProfileNameForm({ initialName }: { initialName: string | null }) {
  const { t } = useTranslation();
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
      setSuccessMessage(t("myInfo.nameUpdated"));
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t("myInfo.nameUpdateFailed"));
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">
      <h2 className="font-medium">{t("myInfo.nameTitle")}</h2>
      <div className="flex flex-col gap-1">
        <input
          id="name"
          type="text"
          className="rounded-full border border-line px-3 py-2 text-sm outline-none transition focus:border-ink"
          {...register("name")}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      {successMessage && <p className="text-sm text-green-700">{successMessage}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-fit items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper transition hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting && <Spinner />}
        {isSubmitting ? t("myInfo.saving") : t("myInfo.save")}
      </button>
    </form>
  );
}

function PasswordChangeForm() {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const changePasswordFormSchema = useMemo(
    () =>
      changePasswordSchema
        .extend({ confirmPassword: z.string().min(1, t("myInfo.confirmPasswordRequired")) })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t("myInfo.passwordMismatch"),
          path: ["confirmPassword"],
        }),
    [t],
  );

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
      setSuccessMessage(t("myInfo.passwordUpdated"));
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t("myInfo.passwordUpdateFailed"));
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">
      <h2 className="font-medium">{t("myInfo.changePasswordTitle")}</h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="currentPassword" className="text-sm text-muted">
          {t("myInfo.currentPasswordLabel")}
        </label>
        <input
          id="currentPassword"
          type="password"
          className="rounded-full border border-line px-3 py-2 text-sm outline-none transition focus:border-ink"
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <p className="text-sm text-red-600">{errors.currentPassword.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="newPassword" className="text-sm text-muted">
          {t("myInfo.newPasswordLabel")}
        </label>
        <input
          id="newPassword"
          type="password"
          className="rounded-full border border-line px-3 py-2 text-sm outline-none transition focus:border-ink"
          {...register("newPassword")}
        />
        {errors.newPassword && <p className="text-sm text-red-600">{errors.newPassword.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm text-muted">
          {t("myInfo.confirmPasswordLabel")}
        </label>
        <input
          id="confirmPassword"
          type="password"
          className="rounded-full border border-line px-3 py-2 text-sm outline-none transition focus:border-ink"
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
        className="flex w-fit items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper transition hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting && <Spinner />}
        {isSubmitting ? t("myInfo.changingPassword") : t("myInfo.changePasswordButton")}
      </button>
    </form>
  );
}
