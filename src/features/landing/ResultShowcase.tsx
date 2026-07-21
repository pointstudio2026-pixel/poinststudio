"use client";

import { useState } from "react";

const TABS = [
  {
    key: "strategy",
    label: "전략",
    render: () => (
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-muted">포지셔닝</p>
        <p className="text-base leading-relaxed sm:text-lg">
          &ldquo;믿을 수 있는 미니멀&rdquo; — 낮은 채도의 뉴트럴 팔레트와 여백을 강조해 진정성 있는 인상을
          전달합니다.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {["미니멀", "내추럴", "신뢰감", "저자극"].map((kw) => (
            <span key={kw} className="rounded-full border border-line bg-paper px-3 py-1 text-sm">
              {kw}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "style",
    label: "스타일",
    render: () => (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { name: "미니멀 유럽", bg: "linear-gradient(135deg, #F1EBDF, #D9CBB8)" },
          { name: "내추럴 웜톤", bg: "linear-gradient(135deg, #EFE7D8, #B9AE9A)" },
          { name: "클린 랩", bg: "linear-gradient(135deg, #EAF0F6, #C9D6E3)" },
          { name: "소프트 뷰티", bg: "linear-gradient(135deg, #F1EBDF, #CBB98F)" },
        ].map((s) => (
          <div key={s.name} className="overflow-hidden rounded-xl border border-line bg-paper">
            <div className="aspect-square" style={{ background: s.bg }} />
            <p className="px-3 py-2 text-sm font-medium">{s.name}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "logo",
    label: "로고 방향",
    render: () => (
      <div className="grid grid-cols-3 gap-3">
        {["심볼 중심", "워드마크", "이니셜 마크"].map((name, i) => (
          <div
            key={name}
            className="flex flex-col items-center gap-2 rounded-xl border border-line bg-paper p-5"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-surface">
              {i === 0 && (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <circle cx="14" cy="14" r="9" />
                </svg>
              )}
              {i === 1 && <span className="font-serif text-sm">Aster</span>}
              {i === 2 && <span className="text-lg font-semibold">A.</span>}
            </div>
            <p className="text-sm text-muted">{name}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "color",
    label: "컬러",
    render: () => (
      <div className="flex flex-wrap gap-4">
        {[
          { hex: "#D9CBB8", name: "Sand" },
          { hex: "#7C6A56", name: "Bark" },
          { hex: "#3A342B", name: "Espresso" },
          { hex: "#171512", name: "Ink" },
        ].map((c) => (
          <div key={c.hex} className="flex flex-col items-center gap-2">
            <span className="h-16 w-16 rounded-2xl border border-line" style={{ backgroundColor: c.hex }} />
            <p className="text-sm">{c.name}</p>
            <p className="text-xs text-muted">{c.hex}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "mockup",
    label: "목업",
    render: () => (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {["패키지", "명함", "웹 배너"].map((name) => (
          <div key={name} className="overflow-hidden rounded-xl border border-line bg-paper">
            <div className="flex aspect-[4/3] items-center justify-center bg-tint-beige">
              <span className="font-serif text-2xl text-ink/70">Aster</span>
            </div>
            <p className="px-3 py-2 text-sm font-medium">{name} 적용</p>
          </div>
        ))}
      </div>
    ),
  },
];

export function ResultShowcase() {
  const [active, setActive] = useState(0);

  return (
    <div className="shadow-soft rounded-3xl border border-line bg-surface p-5 sm:p-8">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(i)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active === i ? "bg-ink text-paper" : "border border-line text-muted hover:border-ink hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-6 min-h-[220px]">{TABS[active]!.render()}</div>
    </div>
  );
}
