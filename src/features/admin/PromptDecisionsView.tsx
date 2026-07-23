"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchPromptDecisionRecords, type PromptDecisionRecordDto } from "@/services/admin-service";
import { Spinner } from "@/components/Spinner";

function RecordRow({ record }: { record: PromptDecisionRecordDto }) {
  const [expanded, setExpanded] = useState(false);
  const hasConflicts = record.conflicts.length > 0;

  return (
    <li className="rounded-md border border-neutral-200 p-3">
      <button type="button" onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between text-left">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">{new Date(record.createdAt).toLocaleString("ko-KR")}</span>
          {hasConflicts ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              충돌 {record.conflicts.length}건 -- 사용자 우선 처리
            </span>
          ) : (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">충돌 없음</span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              record.complianceCheck.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {record.complianceCheck.passed ? "프롬프트 검증 통과" : "프롬프트 검증 실패"}
          </span>
          <span className="text-xs text-neutral-400">
            DB 참고 {record.dbCandidatesUsed.length}/{record.dbCandidatesFound.length}건 사용
          </span>
        </div>
        <span className="text-xs text-neutral-400">{expanded ? "접기" : "펼치기"}</span>
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3 border-t border-neutral-100 pt-3 text-xs">
          <div>
            <p className="font-medium text-neutral-700">하드 제약조건</p>
            <pre className="mt-1 overflow-x-auto rounded bg-neutral-50 p-2 text-[11px] text-neutral-600">
              {JSON.stringify(record.hardConstraints, null, 2)}
            </pre>
          </div>
          {hasConflicts && (
            <div>
              <p className="font-medium text-neutral-700">충돌 및 처리 내역</p>
              <ul className="mt-1 flex flex-col gap-2">
                {record.conflicts.map((c, i) => (
                  <li key={i} className="rounded bg-amber-50 p-2 text-[11px] text-amber-900">
                    <p>
                      <strong>{c.category}</strong> -- 사용자: {c.userValue} / DB 추천 폐기: {c.discardedSuggestion}
                    </p>
                    <p className="mt-1 text-amber-700">대체 보완: {c.preservedGoalVia}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!record.complianceCheck.passed && (
            <div>
              <p className="font-medium text-red-700">프롬프트 검증 이슈(텍스트 레벨, 이미지 자체는 미검증)</p>
              <ul className="mt-1 list-disc pl-4 text-red-600">
                {record.complianceCheck.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export function PromptDecisionsView() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-prompt-decisions"],
    queryFn: fetchPromptDecisionRecords,
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">프롬프트 우선순위 판단 기록</h1>
          <p className="mt-1 text-sm text-neutral-500">
            프로젝트별로 사용자 필수 조건이 DB 추천과 충돌했는지, 충돌 시 어떻게 처리했는지 확인할 수 있습니다.
            일반 사용자에게는 노출되지 않습니다.
          </p>
        </div>
        <Link href="/ops-portal-7x2q/training-examples" className="text-sm underline">
          작업물 스타일로
        </Link>
      </header>

      {isLoading && (
        <div className="flex justify-center p-6">
          <Spinner />
        </div>
      )}
      {!isLoading && data?.records.length === 0 && (
        <p className="text-center text-sm text-neutral-400">아직 기록이 없습니다.</p>
      )}

      <ul className="flex flex-col gap-2">
        {data?.records.map((record) => (
          <RecordRow key={record.id} record={record} />
        ))}
      </ul>
    </main>
  );
}
