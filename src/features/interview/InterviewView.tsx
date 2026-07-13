"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  completeInterview,
  fetchInterview,
  generateFollowUpQuestion,
  saveInterviewAnswer,
  type InterviewQuestionDto,
} from "@/services/interview-service";
import { Spinner } from "@/components/Spinner";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 1500;

export function InterviewView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["interview", projectId],
    queryFn: () => fetchInterview(projectId),
  });

  const [questions, setQuestions] = useState<InterviewQuestionDto[]>([]);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [showSummary, setShowSummary] = useState(false);
  const [isCheckingFollowUp, setIsCheckingFollowUp] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!data || hydrated.current) return;
    hydrated.current = true;
    const initialAnswers: Record<string, string> = {};
    for (const a of data.interview.answers) {
      if (a.answer) initialAnswers[a.questionKey] = a.answer;
    }
    setAnswers(initialAnswers);
    setQuestions(data.questions);
    // 새로고침 후 복원: 서버에 저장된 진행 지점으로 이동한다.
    setDisplayIndex(Math.min(data.interview.currentQuestionIndex, data.questions.length - 1));
  }, [data]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const currentQuestion = questions[displayIndex];
  const progress = questions.length > 0 ? Math.round(((displayIndex + 1) / questions.length) * 100) : 0;
  const missingRequired = questions.filter((q) => q.required && !(answers[q.key] ?? "").trim());

  async function persist(questionKey: string, value: string) {
    setSaveStatus("saving");
    try {
      const result = await saveInterviewAnswer(projectId, questionKey, value);
      setQuestions(result.questions);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  function handleChange(value: string) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: value }));
    setValidationError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persist(currentQuestion.key, value), AUTOSAVE_DELAY_MS);
  }

  async function goNext() {
    if (!currentQuestion) return;
    const value = answers[currentQuestion.key] ?? "";
    if (currentQuestion.required && !value.trim()) {
      setValidationError("필수 질문입니다. 답변을 입력해주세요.");
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await persist(currentQuestion.key, value);

    if (displayIndex < questions.length - 1) {
      setDisplayIndex((i) => i + 1);
      return;
    }

    // 마지막 질문까지 답했다 — 부족한 답변이 있으면 AI 후속 질문을 하나 더
    // 받아온다(최대 3개, 이미 물어본 항목은 다시 묻지 않는다).
    setIsCheckingFollowUp(true);
    try {
      const result = await generateFollowUpQuestion(projectId);
      setQuestions(result.questions);
      if (result.followUpGenerated) {
        setDisplayIndex(result.questions.length - 1);
      } else {
        setShowSummary(true);
      }
    } catch {
      setShowSummary(true);
    } finally {
      setIsCheckingFollowUp(false);
    }
  }

  function goPrevious() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (showSummary) {
      setShowSummary(false);
      return;
    }
    setDisplayIndex((i) => Math.max(0, i - 1));
  }

  async function handleComplete() {
    setIsCompleting(true);
    setCompleteError(null);
    try {
      await completeInterview(projectId);
      router.push(`/projects/${projectId}`);
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : "완료 처리에 실패했습니다.");
    } finally {
      setIsCompleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-red-600">
        인터뷰를 불러오지 못했습니다.
      </div>
    );
  }

  if (data.interview.status === "completed") {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold">인터뷰가 완료되었습니다</h1>
        <p className="text-sm text-neutral-500">
          답변은 이후 Brand Brief 생성에 사용됩니다 (다음 작업에서 구현 예정).
        </p>
        <Link href={`/projects/${projectId}`} className="text-sm underline">
          프로젝트로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <Link href={`/projects/${projectId}`} className="text-sm underline">
          ← 프로젝트로
        </Link>
        <span className="text-xs text-neutral-400">
          {saveStatus === "saving" && "저장 중..."}
          {saveStatus === "saved" && "저장됨"}
          {saveStatus === "error" && "저장 실패"}
        </span>
      </header>

      <div className="h-1.5 w-full rounded-full bg-neutral-100">
        <div
          className="h-1.5 rounded-full bg-neutral-900 transition-all"
          style={{ width: `${showSummary ? 100 : progress}%` }}
        />
      </div>

      {isCheckingFollowUp && (
        <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
          <Spinner />
          답변을 검토하고 있어요...
        </div>
      )}

      {!isCheckingFollowUp && !showSummary && currentQuestion && (
        <section className="flex flex-col gap-3">
          <p className="text-xs text-neutral-400">
            {displayIndex + 1} / {questions.length}
            {currentQuestion.key.startsWith("followUp_") && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                AI 추가 질문
              </span>
            )}
          </p>
          <h1 className="text-lg font-medium">
            {currentQuestion.text}
            {currentQuestion.required && <span className="ml-1 text-red-500">*</span>}
          </h1>

          {currentQuestion.type === "textarea" ? (
            <textarea
              value={answers[currentQuestion.key] ?? ""}
              onChange={(e) => handleChange(e.target.value)}
              rows={5}
              autoFocus
              className="rounded-md border border-neutral-300 px-3 py-2"
            />
          ) : (
            <input
              type="text"
              value={answers[currentQuestion.key] ?? ""}
              onChange={(e) => handleChange(e.target.value)}
              autoFocus
              className="rounded-md border border-neutral-300 px-3 py-2"
            />
          )}

          {validationError && <p className="text-sm text-red-600">{validationError}</p>}

          <div className="mt-2 flex justify-between">
            <button
              type="button"
              onClick={goPrevious}
              disabled={displayIndex === 0}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm disabled:opacity-40"
            >
              이전
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white"
            >
              {displayIndex < questions.length - 1 ? "다음" : "검토하기"}
            </button>
          </div>
        </section>
      )}

      {!isCheckingFollowUp && showSummary && (
        <section className="flex flex-col gap-4">
          <h1 className="text-lg font-medium">답변 검토</h1>
          <ul className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <li key={q.key} className="rounded-md border border-neutral-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{q.text}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSummary(false);
                      setDisplayIndex(i);
                    }}
                    className="text-xs underline"
                  >
                    수정
                  </button>
                </div>
                <p className="mt-1 text-neutral-500">
                  {answers[q.key]?.trim() ? answers[q.key] : "(답변 없음)"}
                </p>
              </li>
            ))}
          </ul>

          {missingRequired.length > 0 && (
            <p className="text-sm text-red-600">
              필수 질문에 답변하지 않았습니다: {missingRequired.map((q) => q.text).join(", ")}
            </p>
          )}
          {completeError && <p className="text-sm text-red-600">{completeError}</p>}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={goPrevious}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
            >
              이전
            </button>
            <button
              type="button"
              onClick={handleComplete}
              disabled={isCompleting || missingRequired.length > 0}
              className="flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {isCompleting && <Spinner />}
              인터뷰 완료
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
