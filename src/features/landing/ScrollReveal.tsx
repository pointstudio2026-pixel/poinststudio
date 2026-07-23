"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 절제된 스크롤 리빌 -- 섹션이 뷰포트에 처음 들어올 때 한 번만 페이드+
 * 슬라이드업(globals.css의 .reveal-on-scroll)한다. 순수 시각 효과라 콘텐츠/
 * 동작에는 영향이 없고, prefers-reduced-motion이면 CSS 쪽에서 즉시
 * 보이는 상태로 고정된다.
 */
export function ScrollReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal-on-scroll ${isVisible ? "is-visible" : ""} ${className ?? ""}`}>
      {children}
    </div>
  );
}
