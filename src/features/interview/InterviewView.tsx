"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completeInterview,
  extractOtherAnswerText,
  fetchInterview,
  generateFollowUpQuestion,
  OTHER_ANSWER_PREFIX,
  saveInterviewAnswer,
  type InterviewQuestionDto,
} from "@/services/interview-service";
import { Spinner } from "@/components/Spinner";
import { NextStepButton } from "@/features/workspace/NextStepButton";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 1500;

/** optionGroups가 있는 질문에서, 이미 선택된 leaf 옵션이 속한 대주제를 찾는다 -- 없으면 null(대주제 선택 화면부터 시작). */
function matchGroupForAnswer(question: InterviewQuestionDto, answer: string): string | null {
  if (!question.optionGroups) return null;
  const leaves = answer.split(",").map((v) => v.trim()).filter(Boolean);
  const match = question.optionGroups.find((g) => g.options.some((opt) => leaves.includes(opt)));
  return match?.group ?? null;
}

export function InterviewView({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["interview", projectId],
    queryFn: () => fetchInterview(projectId),
  });

  // 답변 저장(persist)이 쿼리 캐시를 갱신하지 않으므로, 사이드바로 다른
  // 단계에 갔다가 돌아오면 낡은 캐시가 먼저 그려지고 이후 도착하는 최신
  // 데이터는 무시된다(아래 hydrated 가드 때문에 한 번만 반영). 나갈 때
  // 캐시를 지워서 다시 들어올 때는 항상 서버에서 최신 상태를 새로 받아오게
  // 한다.
  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ["interview", projectId] });
    };
  }, [queryClient, projectId]);

  const [questions, setQuestions] = useState<InterviewQuestionDto[]>([]);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [optionSearch, setOptionSearch] = useState("");
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
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
    const restoredIndex = Math.min(data.interview.currentQuestionIndex, data.questions.length - 1);
    setDisplayIndex(restoredIndex);
    const restoredQuestion = data.questions[restoredIndex];
    setSelectedGroupName(
      restoredQuestion ? matchGroupForAnswer(restoredQuestion, initialAnswers[restoredQuestion.key] ?? "") : null,
    );
  }, [data]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const currentQuestion = questions[displayIndex];
  const progress = questions.length > 0 ? Math.round(((displayIndex + 1) / questions.length) * 100) : 0;
  const missingRequired = questions.filter((q) => q.required && !(answers[q.key] ?? "").trim());
  // "기타(직접 입력)" 인라인 입력창 값 -- 별도 state/effect 없이 저장된 답변에서
  // 매 렌더마다 그대로 파생시킨다(handleChange가 이미 answers를 동기적으로
  // 갱신하므로 타이핑 중에도 항상 최신값, 새로고침 복원도 자동으로 따라온다).
  const otherDraft = currentQuestion
    ? (extractOtherAnswerText(answers[currentQuestion.key] ?? "", currentQuestion.multiple) ?? "")
    : "";

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

  // 다중 선택 답변은 새 컬럼/배열 타입 없이 콤마로 이어붙인 문자열로 저장한다
  // (예: "행사명/타이틀, 날짜, QR코드") -- 클릭할 때마다 파싱해서 토글한 뒤
  // 다시 조인해 기존 handleChange(단일 값 교체)에 그대로 넘긴다.
  function handleToggleOption(option: string) {
    if (!currentQuestion) return;
    const current = (answers[currentQuestion.key] ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const next = current.includes(option) ? current.filter((v) => v !== option) : [...current, option];
    handleChange(next.join(", "));
  }

  function isOtherSelected(): boolean {
    if (!currentQuestion) return false;
    return extractOtherAnswerText(answers[currentQuestion.key] ?? "", currentQuestion.multiple) !== null;
  }

  // "기타" 버튼 클릭: 이미 선택된 상태면 해제(다른 보기와 동일한 토글 동작),
  // 아니면 지금까지 입력해둔 otherDraft를 담아 선택 상태로 만든다.
  function handleToggleOther() {
    if (!currentQuestion) return;
    const otherValue = `${OTHER_ANSWER_PREFIX}${otherDraft}`;
    if (currentQuestion.multiple) {
      const current = (answers[currentQuestion.key] ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const withoutOther = current.filter((v) => !v.startsWith(OTHER_ANSWER_PREFIX));
      const next = isOtherSelected() ? withoutOther : [...withoutOther, otherValue];
      handleChange(next.join(", "));
    } else {
      handleChange(isOtherSelected() ? "" : otherValue);
    }
  }

  // "기타" 인라인 입력창에 타이핑할 때: 콤마는 다중 선택 저장의 구분자와
  // 충돌하므로 저장 전에 다른 문자로 치환한다.
  function handleOtherTextChange(text: string) {
    if (!currentQuestion) return;
    const sanitized = text.replace(/,/g, "、");
    const otherValue = `${OTHER_ANSWER_PREFIX}${sanitized}`;
    if (currentQuestion.multiple) {
      const current = (answers[currentQuestion.key] ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const withoutOther = current.filter((v) => !v.startsWith(OTHER_ANSWER_PREFIX));
      handleChange([...withoutOther, otherValue].join(", "));
    } else {
      handleChange(otherValue);
    }
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
      const nextQuestion = questions[displayIndex + 1];
      setDisplayIndex((i) => i + 1);
      setSelectedGroupName(nextQuestion ? matchGroupForAnswer(nextQuestion, answers[nextQuestion.key] ?? "") : null);
      setOptionSearch("");
      return;
    }

    // 마지막 질문까지 답했다 — 부족한 답변이 있으면 AI 후속 질문을 하나 더
    // 받아온다(최대 3개, 이미 물어본 항목은 다시 묻지 않는다).
    setIsCheckingFollowUp(true);
    try {
      const result = await generateFollowUpQuestion(projectId);
      setQuestions(result.questions);
      if (result.followUpGenerated) {
        const nextQuestion = result.questions[result.questions.length - 1];
        setDisplayIndex(result.questions.length - 1);
        setSelectedGroupName(
          nextQuestion ? matchGroupForAnswer(nextQuestion, answers[nextQuestion.key] ?? "") : null,
        );
        setOptionSearch("");
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
    const previousIndex = Math.max(0, displayIndex - 1);
    const previousQuestion = questions[previousIndex];
    setDisplayIndex(previousIndex);
    setSelectedGroupName(
      previousQuestion ? matchGroupForAnswer(previousQuestion, answers[previousQuestion.key] ?? "") : null,
    );
    setOptionSearch("");
  }

  async function handleComplete() {
    setIsCompleting(true);
    setCompleteError(null);
    try {
      await completeInterview(projectId);
      await queryClient.invalidateQueries({ queryKey: ["interview", projectId] });
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : "완료 처리에 실패했습니다.");
    } finally {
      setIsCompleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-red-600">
        인터뷰를 불러오지 못했습니다.
      </div>
    );
  }

  if (data.interview.status === "completed") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold">인터뷰가 완료되었습니다</h1>
          <p className="mt-1 text-sm text-muted">입력하신 답변은 스타일 추천과 브랜드 전략 분석에 사용됩니다.</p>
        </div>

        <ul className="flex flex-col gap-3">
          {data.questions.map((q) => {
            const record = data.interview.answers.find((a) => a.questionKey === q.key);
            return (
              <li key={q.key} className="rounded-md border border-neutral-200 p-3 text-sm">
                <span className="font-medium">{q.text}</span>
                <p className="mt-1 text-neutral-500">
                  {record?.answer?.trim() ? record.answer : "(답변 없음)"}
                </p>
              </li>
            );
          })}
        </ul>

        <div>
          <NextStepButton projectId={projectId} currentStepKey="brand_interview" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-end">
        <span className="text-xs text-muted">
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

          {currentQuestion.type === "select" ? (
            <div className="flex flex-col gap-2">
              {currentQuestion.optionGroups ? (
                selectedGroupName === null ? (
                  <ul className="flex flex-col gap-1">
                    {currentQuestion.optionGroups.map((g) => (
                      <li key={g.group}>
                        <button
                          type="button"
                          onClick={() => setSelectedGroupName(g.group)}
                          className="flex w-full items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-left text-sm hover:bg-neutral-100"
                        >
                          {g.group}
                          <span aria-hidden className="text-neutral-400">
                            ›
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedGroupName(null)}
                      className="w-fit text-xs text-neutral-500 underline"
                    >
                      ‹ 다른 주제 선택
                    </button>
                    <ul className="flex flex-col gap-1 rounded-md border border-neutral-200 p-1">
                      {(
                        currentQuestion.optionGroups.find((g) => g.group === selectedGroupName)?.options ?? []
                      ).map((option) => {
                        const isSelected = currentQuestion.multiple
                          ? (answers[currentQuestion.key] ?? "")
                              .split(",")
                              .map((v) => v.trim())
                              .includes(option)
                          : answers[currentQuestion.key] === option;
                        return (
                          <li key={option}>
                            <button
                              type="button"
                              onClick={() =>
                                currentQuestion.multiple ? handleToggleOption(option) : handleChange(option)
                              }
                              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                                isSelected ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
                              }`}
                            >
                              {option}
                              {isSelected && <span aria-hidden>✓</span>}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )
              ) : (
                <>
                  <input
                    type="text"
                    value={optionSearch}
                    onChange={(e) => setOptionSearch(e.target.value)}
                    placeholder="검색 또는 목록에서 선택"
                    autoFocus
                    className="rounded-md border border-neutral-300 px-3 py-2"
                  />
                  <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-md border border-neutral-200 p-1">
                    {(currentQuestion.options ?? [])
                      .filter((option) => option.toLowerCase().includes(optionSearch.trim().toLowerCase()))
                      .map((option) => {
                        const isSelected = currentQuestion.multiple
                          ? (answers[currentQuestion.key] ?? "")
                              .split(",")
                              .map((v) => v.trim())
                              .includes(option)
                          : answers[currentQuestion.key] === option;
                        return (
                          <li key={option}>
                            <button
                              type="button"
                              onClick={() =>
                                currentQuestion.multiple ? handleToggleOption(option) : handleChange(option)
                              }
                              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                                isSelected ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
                              }`}
                            >
                              {option}
                              {isSelected && <span aria-hidden>✓</span>}
                            </button>
                          </li>
                        );
                      })}
                    {(currentQuestion.options ?? []).filter((option) =>
                      option.toLowerCase().includes(optionSearch.trim().toLowerCase()),
                    ).length === 0 && (
                      <li className="px-3 py-2 text-sm text-neutral-400">검색 결과가 없습니다.</li>
                    )}
                  </ul>
                </>
              )}
              <ul className="flex flex-col gap-1">
                {currentQuestion.allowOther && (
                  <li>
                    <button
                      type="button"
                      onClick={handleToggleOther}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                        isOtherSelected() ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
                      }`}
                    >
                      기타 (직접 입력)
                      {isOtherSelected() && <span aria-hidden>✓</span>}
                    </button>
                  </li>
                )}
              </ul>
              {currentQuestion.allowOther && isOtherSelected() && (
                <input
                  type="text"
                  value={otherDraft}
                  onChange={(e) => handleOtherTextChange(e.target.value)}
                  placeholder="직접 입력해주세요"
                  autoFocus
                  className="rounded-md border border-neutral-300 px-3 py-2"
                />
              )}
            </div>
          ) : currentQuestion.type === "textarea" ? (
            <>
              <textarea
                value={answers[currentQuestion.key] ?? ""}
                onChange={(e) => handleChange(e.target.value)}
                rows={5}
                autoFocus
                className="rounded-md border border-neutral-300 px-3 py-2"
              />
              {!currentQuestion.required && (
                <p className="text-xs text-neutral-400">작성하지 않아도 다음 단계로 넘어갈 수 있습니다.</p>
              )}
            </>
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
                      setSelectedGroupName(matchGroupForAnswer(q, answers[q.key] ?? ""));
                      setOptionSearch("");
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
    </div>
  );
}
