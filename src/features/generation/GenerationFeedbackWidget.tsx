"use client";

import { useState } from "react";
import { submitGenerationFeedback } from "@/services/generations-service";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";

// 저장되는 값은 항상 이 한국어 리터럴 그대로다(DB/점수 계산은 텍스트 내용이
// 아니라 개수만 본다 -- computeGenerationUsageScore 참고) -- 화면에 보여줄
// 라벨만 로케일에 맞게 번역한다.
const LIKED_TAGS: { value: string; labelKey: MessageKey }[] = [
  { value: "색감이 좋아요", labelKey: "generationFeedback.likedColor" },
  { value: "전체 느낌이 좋아요", labelKey: "generationFeedback.likedOverall" },
  { value: "구성/레이아웃이 좋아요", labelKey: "generationFeedback.likedLayout" },
  { value: "브랜드와 잘 어울려요", labelKey: "generationFeedback.likedBrandFit" },
];
const DISLIKED_TAGS: { value: string; labelKey: MessageKey }[] = [
  { value: "색감이 아쉬워요", labelKey: "generationFeedback.dislikedColor" },
  { value: "너무 복잡해요", labelKey: "generationFeedback.dislikedComplex" },
  { value: "브랜드와 안 어울려요", labelKey: "generationFeedback.dislikedBrandFit" },
  { value: "전체적으로 별로예요", labelKey: "generationFeedback.dislikedOverall" },
];

/**
 * 결과물 평가 위젯 -- 선택형 태그(타이핑 불필요) + 자유 텍스트(선택).
 * 완전히 건너뛰기 가능(평가 안 해도 다음 단계로 진행 가능, 이 컴포넌트
 * 자체가 접혀있는 게 기본 상태). AI 호출 없음, 비용 0.
 */
export function GenerationFeedbackWidget({ generationVersionId }: { generationVersionId: string }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [saved, setSaved] = useState(false);

  function toggleLiked(tag: string) {
    const next = liked.includes(tag) ? liked.filter((t) => t !== tag) : [...liked, tag];
    setLiked(next);
    void save(next, disliked, freeText);
  }

  function toggleDisliked(tag: string) {
    const next = disliked.includes(tag) ? disliked.filter((t) => t !== tag) : [...disliked, tag];
    setDisliked(next);
    void save(liked, next, freeText);
  }

  async function save(nextLiked: string[], nextDisliked: string[], nextFreeText: string) {
    try {
      await submitGenerationFeedback(generationVersionId, {
        likedTags: nextLiked,
        dislikedTags: nextDisliked,
        freeText: nextFreeText || null,
      });
      setSaved(true);
    } catch {
      // 평가는 선택 사항이라 실패해도 화면을 막지 않는다.
    }
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-600"
      >
        {t("generationFeedback.rateThisResult")}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex flex-wrap gap-1.5">
        {LIKED_TAGS.map(({ value, labelKey }) => (
          <button
            key={value}
            type="button"
            onClick={() => toggleLiked(value)}
            className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
              liked.includes(value)
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-neutral-300 text-neutral-600 hover:border-neutral-500"
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
        {DISLIKED_TAGS.map(({ value, labelKey }) => (
          <button
            key={value}
            type="button"
            onClick={() => toggleDisliked(value)}
            className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
              disliked.includes(value)
                ? "border-red-500 bg-red-50 text-red-600"
                : "border-neutral-300 text-neutral-600 hover:border-neutral-500"
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={freeText}
          onChange={(e) => {
            setFreeText(e.target.value);
            setSaved(false);
          }}
          placeholder={t("generationFeedback.freeTextPlaceholder")}
          maxLength={1000}
          className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-xs outline-none focus:border-neutral-500"
        />
        <button
          type="button"
          onClick={() => void save(liked, disliked, freeText)}
          className="rounded-md border border-neutral-300 px-2 py-1 text-xs hover:border-neutral-500"
        >
          {saved ? t("generationFeedback.saved") : t("generationFeedback.save")}
        </button>
      </div>
    </div>
  );
}
