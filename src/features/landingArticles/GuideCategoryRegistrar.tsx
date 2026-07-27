"use client";

import { useEffect } from "react";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

/**
 * 가이드 허브/글 화면(서버 컴포넌트)이 렌더링하는 얇은 클라이언트 자식 --
 * 실제로 표시 중인 category를 LocaleProvider에 등록해, 언어 전환 시 어느
 * 허브(디자인 가이드 vs FAQ)로 돌아가야 하는지 정확히 알 수 있게 한다.
 */
export function GuideCategoryRegistrar({ category }: { category: string | null }) {
  const { setGuideCategory } = useTranslation();

  useEffect(() => {
    setGuideCategory(category);
  }, [category, setGuideCategory]);

  return null;
}
