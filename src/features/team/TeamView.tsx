"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerTeam, joinTeam, type TeamDto, type TeamMembershipDto } from "@/services/team-service";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { Spinner } from "@/components/Spinner";
import { AppHeader } from "@/features/navigation/AppHeader";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

export function TeamView({
  email,
  name,
  planCode,
  ownedTeam,
  memberships,
}: {
  email: string;
  name: string | null;
  planCode: PlanCode;
  ownedTeam: TeamDto | null;
  memberships: TeamMembershipDto[];
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  async function handleRegister() {
    setIsRegistering(true);
    setRegisterError(null);
    try {
      await registerTeam();
      router.refresh();
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : t("team.registerError"));
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setIsJoining(true);
    setJoinError(null);
    setJoinSuccess(false);
    try {
      await joinTeam(code);
      setJoinSuccess(true);
      setCode("");
      router.refresh();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : t("team.joinError"));
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader user={{ email, name }} planCode={planCode} />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">{t("team.title")}</h1>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <p className="text-sm font-medium">{t("team.myTeam")}</p>
        {planCode !== "studio" ? (
          <p className="text-sm text-muted">
            {t("team.studioOnly")}{" "}
            <Link href="/subscription" className="underline">
              {t("team.viewPlans")}
            </Link>
          </p>
        ) : ownedTeam ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted">{t("team.shareDescription")}</p>
            <p className="rounded-xl border border-line bg-line px-4 py-3 text-center text-2xl font-semibold tracking-widest">
              {ownedTeam.code}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted">{t("team.noTeamYet")}</p>
            <button
              type="button"
              onClick={handleRegister}
              disabled={isRegistering}
              className="flex w-fit items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50"
            >
              {isRegistering && <Spinner />}
              {t("team.registerButton")}
            </button>
            {registerError && <p className="text-sm text-red-600">{registerError}</p>}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <p className="text-sm font-medium">{t("team.joinByCode")}</p>
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("team.codePlaceholder")}
            maxLength={6}
            className="flex-1 rounded-full border border-line px-3 py-2 text-sm outline-none focus:border-ink"
          />
          <button
            type="submit"
            disabled={isJoining || code.length !== 6}
            className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm disabled:opacity-50"
          >
            {isJoining && <Spinner />}
            {t("team.joinButton")}
          </button>
        </form>
        {joinError && <p className="text-sm text-red-600">{joinError}</p>}
        {joinSuccess && <p className="text-sm text-green-600">{t("team.joinSuccess")}</p>}
        <p className="text-sm text-muted">
          {memberships.length > 0
            ? t("team.membershipCount", { count: memberships.length })
            : t("team.noMemberships")}
        </p>
      </section>
      </main>
    </div>
  );
}
