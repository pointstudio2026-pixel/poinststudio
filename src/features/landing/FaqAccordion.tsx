"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "무료로 시작할 수 있나요?",
    answer: "네, Free 플랜으로 매달 10장까지 무료로 이미지를 생성할 수 있습니다.",
  },
  {
    question: "생성된 결과물은 바로 사용할 수 있나요?",
    answer: "네, Export Center에서 PDF·PNG·JPG 파일로 바로 다운로드할 수 있습니다.",
  },
  {
    question: "어떤 업종에 적합한가요?",
    answer: "카페, 병원, IT 스타트업 등 업종별 맞춤 질문으로 브랜드를 더 정확히 파악합니다.",
  },
  {
    question: "이전 단계로 다시 돌아갈 수 있나요?",
    answer: "네, 브랜드 인터뷰부터 목업까지 모든 단계를 프로젝트 안에서 언제든 다시 확인할 수 있습니다.",
  },
  {
    question: "Pro·Studio 플랜은 무엇이 다른가요?",
    answer: "더 높은 월 생성 한도와 고해상도 결과물, 우선 처리 큐를 제공합니다.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ul className="mx-auto flex max-w-[880px] flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <li key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex min-h-[64px] w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-medium sm:text-lg"
            >
              {item.question}
              <span
                className={`flex-shrink-0 text-xl text-muted transition-transform duration-200 ${
                  isOpen ? "rotate-45" : ""
                }`}
                aria-hidden
              >
                +
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-base leading-relaxed text-muted">{item.answer}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
