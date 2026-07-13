"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";
import { Spinner } from "@/components/Spinner";

export function LogoutButton() {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const [isPending, setIsPending] = useState(false);

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
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
    >
      {isPending && <Spinner />}
      {isPending ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
