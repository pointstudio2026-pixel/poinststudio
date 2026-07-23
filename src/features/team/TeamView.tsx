"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerTeam, joinTeam, type TeamDto, type TeamMembershipDto } from "@/services/team-service";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { Spinner } from "@/components/Spinner";
import { AppHeader } from "@/features/navigation/AppHeader";

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
      setRegisterError(err instanceof Error ? err.message : "팀 등록에 실패했습니다.");
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
      setJoinError(err instanceof Error ? err.message : "팀 참여에 실패했습니다.");
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader user={{ email, name }} planCode={planCode} />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">팀</h1>

      <section className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
        <p className="text-sm font-medium">내 팀</p>
        {planCode !== "studio" ? (
          <p className="text-sm text-neutral-500">
            스튜디오 플랜에서 팀을 등록하고 코드로 프로젝트를 공유할 수 있어요.{" "}
            <Link href="/subscription" className="underline">
              구독 플랜 보기
            </Link>
          </p>
        ) : ownedTeam ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-neutral-500">
              이 코드를 팀원에게 공유하세요. 팀원이 코드를 입력하면, 대시보드에서 &quot;팀에
              공유&quot;를 켠 프로젝트를 함께 수정할 수 있어요.
            </p>
            <p className="rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-center text-2xl font-semibold tracking-widest">
              {ownedTeam.code}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-neutral-500">아직 팀이 없어요. 등록하면 참여 코드가 발급됩니다.</p>
            <button
              type="button"
              onClick={handleRegister}
              disabled={isRegistering}
              className="flex w-fit items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {isRegistering && <Spinner />}
              팀 등록
            </button>
            {registerError && <p className="text-sm text-red-600">{registerError}</p>}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
        <p className="text-sm font-medium">코드로 참여하기</p>
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6자리 코드"
            maxLength={6}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          <button
            type="submit"
            disabled={isJoining || code.length !== 6}
            className="flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50"
          >
            {isJoining && <Spinner />}
            참여
          </button>
        </form>
        {joinError && <p className="text-sm text-red-600">{joinError}</p>}
        {joinSuccess && <p className="text-sm text-green-600">팀에 참여했습니다.</p>}
        <p className="text-sm text-neutral-500">
          {memberships.length > 0 ? `현재 ${memberships.length}개 팀에 참여 중이에요.` : "아직 참여한 팀이 없어요."}
        </p>
      </section>
      </main>
    </div>
  );
}
