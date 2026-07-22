"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";
import { Spinner } from "@/components/Spinner";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

export function LogoutButton({
  className = "flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm transition hover:border-ink disabled:opacity-50",
}: {
  className?: string;
}) {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const [isPending, setIsPending] = useState(false);
  const { t } = useTranslation();

  async function handleLogout() {
    setIsPending(true);
    try {
      await logoutUser();
    } catch {
      // Cookies are httpOnly and short-lived; even if this call fails we
      // still want to drop client state and send the user to /login.
    } finally {
      clear();
      router.push("/login");
    }
  }

  return (
    <button type="button" onClick={handleLogout} disabled={isPending} className={className}>
      {isPending && <Spinner />}
      {isPending ? t("nav.loggingOut") : t("nav.logout")}
    </button>
  );
}
