"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchGiftCodes, generateGiftCodes, type GiftCodeDto } from "@/services/admin-service";
import { Spinner } from "@/components/Spinner";

const PLAN_LABELS: Record<string, string> = { pro: "Pro", studio: "Studio" };

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function GiftCodesView() {
  const queryClient = useQueryClient();
  const [planCode, setPlanCode] = useState<"pro" | "studio">("pro");
  const [grantDays, setGrantDays] = useState(31);
  const [count, setCount] = useState(10);
  const [maxRedemptions, setMaxRedemptions] = useState(1);
  const [batchLabel, setBatchLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<GiftCodeDto[] | null>(null);
  const [labelFilter, setLabelFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-gift-codes", labelFilter],
    queryFn: () => fetchGiftCodes(labelFilter || undefined),
  });

  const codes = data?.codes ?? [];
  const totalRedemptions = codes.reduce((sum, c) => sum + c.redemptionCount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const result = await generateGiftCodes({
        planCode,
        grantDays,
        count,
        batchLabel: batchLabel.trim() || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        maxRedemptions: maxRedemptions > 1 ? maxRedemptions : undefined,
      });
      setLastGenerated(result.codes);
      await queryClient.invalidateQueries({ queryKey: ["admin-gift-codes"] });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "발급에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyAll() {
    if (!lastGenerated) return;
    await navigator.clipboard.writeText(lastGenerated.map((c) => c.code).join("\n"));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">선물 코드</h1>
          <p className="mt-1 text-sm text-muted">
            무료 이용자가 코드를 입력하면 지정한 등급으로 지정한 기간 동안 자동 승급되고, 기간이 지나면 매일
            자동으로 free로 되돌아갑니다. 이미 유료 구독 중인 사용자는 사용할 수 없습니다.
          </p>
        </div>
        <Link href="/ops-portal-7x2q" className="text-sm underline">
          대시보드로
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="planCode" className="text-sm text-muted">
              등급
            </label>
            <select
              id="planCode"
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value as "pro" | "studio")}
              className="rounded-full border border-line px-3 py-2 text-sm"
            >
              <option value="pro">Pro</option>
              <option value="studio">Studio</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="grantDays" className="text-sm text-muted">
              부여 기간(일)
            </label>
            <input
              id="grantDays"
              type="number"
              min={1}
              max={365}
              value={grantDays}
              onChange={(e) => setGrantDays(Number(e.target.value))}
              className="rounded-full border border-line px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="count" className="text-sm text-muted">
              발급 개수
            </label>
            <input
              id="count"
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="rounded-full border border-line px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="expiresAt" className="text-sm text-muted">
              등록 마감일 (선택)
            </label>
            <input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="rounded-full border border-line px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="batchLabel" className="text-sm text-muted">
              배치 이름 (선택, 예: 2026-08-런칭이벤트)
            </label>
            <input
              id="batchLabel"
              type="text"
              value={batchLabel}
              onChange={(e) => setBatchLabel(e.target.value)}
              placeholder="배치를 구분할 이름"
              className="rounded-full border border-line px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="maxRedemptions" className="text-sm text-muted">
              코드 1개당 사용 가능 인원
            </label>
            <input
              id="maxRedemptions"
              type="number"
              min={1}
              max={100000}
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(Number(e.target.value))}
              className="rounded-full border border-line px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted">1(기본값)이면 코드당 1명만 사용 가능. 공개 프로모 코드는 여러 명으로 설정.</p>
          </div>
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-fit items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper transition hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? "발급 중..." : "코드 발급"}
        </button>
      </form>

      {lastGenerated && (
        <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">방금 발급한 코드 {lastGenerated.length}개</p>
            <button type="button" onClick={handleCopyAll} className="text-xs underline">
              전체 복사
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto rounded-xl bg-line p-2">
            <ul className="grid grid-cols-2 gap-1 text-xs sm:grid-cols-3">
              {lastGenerated.map((c) => (
                <li key={c.id} className="font-mono">
                  {c.code}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            발급 목록 (코드 {codes.length}개, 총 {totalRedemptions}회 사용됨)
          </p>
          <input
            type="text"
            value={labelFilter}
            onChange={(e) => setLabelFilter(e.target.value)}
            placeholder="배치 이름으로 필터"
            className="rounded-full border border-line px-3 py-1.5 text-xs"
          />
        </div>

        {isLoading && (
          <div className="flex justify-center p-6">
            <Spinner />
          </div>
        )}

        {!isLoading && codes.length === 0 && <p className="text-sm text-muted">발급된 코드가 없습니다.</p>}

        {!isLoading && codes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2 pr-3 font-medium">코드</th>
                  <th className="py-2 pr-3 font-medium">등급</th>
                  <th className="py-2 pr-3 font-medium">기간</th>
                  <th className="py-2 pr-3 font-medium">배치</th>
                  <th className="py-2 pr-3 font-medium">등록 마감</th>
                  <th className="py-2 pr-3 font-medium">사용 현황</th>
                  <th className="py-2 pr-3 font-medium">최근 사용일</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id} className="border-b border-line">
                    <td className="py-2 pr-3 font-mono">{c.code}</td>
                    <td className="py-2 pr-3">{PLAN_LABELS[c.planCode] ?? c.planCode}</td>
                    <td className="py-2 pr-3">{c.grantDays}일</td>
                    <td className="py-2 pr-3">{c.batchLabel ?? "-"}</td>
                    <td className="py-2 pr-3">{formatDate(c.expiresAt)}</td>
                    <td className="py-2 pr-3">
                      {c.redemptionCount >= c.maxRedemptions ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                          {c.redemptionCount}/{c.maxRedemptions} 소진
                        </span>
                      ) : c.redemptionCount > 0 ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                          {c.redemptionCount}/{c.maxRedemptions}
                        </span>
                      ) : (
                        <span className="rounded-full bg-line px-2 py-0.5 text-muted">
                          0/{c.maxRedemptions} 미사용
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3">{formatDate(c.redeemedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
