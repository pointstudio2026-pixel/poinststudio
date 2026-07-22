"use client";

import { useState } from "react";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";

const FAQ_ITEMS: { questionKey: MessageKey; answerKey: MessageKey }[] = [
  { questionKey: "home.faq.q1", answerKey: "home.faq.a1" },
  { questionKey: "home.faq.q2", answerKey: "home.faq.a2" },
  { questionKey: "home.faq.q3", answerKey: "home.faq.a3" },
  { questionKey: "home.faq.q4", answerKey: "home.faq.a4" },
  { questionKey: "home.faq.q5", answerKey: "home.faq.a5" },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { t } = useTranslation();

  return (
    <ul className="mx-auto flex max-w-[880px] flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <li key={item.questionKey}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex min-h-[64px] w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-medium sm:text-lg"
            >
              {t(item.questionKey)}
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
                <p className="px-5 pb-5 text-base leading-relaxed text-muted">{t(item.answerKey)}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
