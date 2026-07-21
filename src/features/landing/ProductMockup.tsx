const STEPS = ["브랜드 인터뷰", "스타일", "브랜드 전략", "이미지 생성", "컨셉 보드", "목업"];
const ACTIVE_STEP_INDEX = 2;

const PALETTE = ["#D9CBB8", "#7C6A56", "#3A342B", "#171512"];

const GENERATIONS = [
  { bg: "linear-gradient(135deg, #EFE7D8, #D9CBB8)" },
  { bg: "linear-gradient(135deg, #E7E2D6, #B9AE9A)" },
  { bg: "linear-gradient(135deg, #EAF0F6, #C9D6E3)" },
  { bg: "linear-gradient(135deg, #F1EBDF, #CBB98F)" },
];

/**
 * Purely illustrative recreation of the real project workspace (same step
 * labels/order as WORKSPACE_STEPS) -- not a live embed, just a static
 * mockup for the marketing Hero.
 */
export function ProductMockup() {
  return (
    <div className="shadow-soft-lg w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex items-center gap-1.5 border-b border-line px-5 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="ml-3 text-xs text-muted">ASTER Workspace — 비건 코스메틱 브랜딩</span>
      </div>

      <div className="flex">
        <aside className="hidden w-32 flex-shrink-0 flex-col gap-1 border-r border-line p-3 sm:flex">
          {STEPS.map((step, i) => (
            <span
              key={step}
              className={`rounded-full px-2.5 py-1.5 text-[11px] leading-tight ${
                i === ACTIVE_STEP_INDEX ? "bg-ink text-paper" : i < ACTIVE_STEP_INDEX ? "text-ink" : "text-muted"
              }`}
            >
              {step}
            </span>
          ))}
        </aside>

        <div className="flex-1 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted">전략 분석 결과</p>
            <span className="rounded-full bg-tint-blue px-2 py-0.5 text-[10px] font-medium text-ink">
              신뢰도 높음
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed">
            &ldquo;믿을 수 있는 미니멀&rdquo;을 핵심 포지셔닝으로, 낮은 채도의 뉴트럴 팔레트와 여백을 강조하는
            방향을 제안합니다.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-paper p-3">
              <p className="text-[10px] font-medium text-muted">Font Pairing</p>
              <p className="mt-1 font-serif text-lg">Canela</p>
            </div>
            <div className="rounded-xl border border-line bg-paper p-3">
              <p className="text-[10px] font-medium text-muted">Color Palette</p>
              <div className="mt-1.5 flex gap-1.5">
                {PALETTE.map((color) => (
                  <span key={color} className="h-4 w-4 rounded-full border border-line" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          </div>

          <p className="mt-4 text-[10px] font-medium text-muted">생성 결과</p>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {GENERATIONS.map((g, i) => (
              <div key={i} className="aspect-square rounded-lg border border-line" style={{ background: g.bg }} />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-line">
              <div
                className="h-1.5 rounded-full bg-ink"
                style={{ width: `${((ACTIVE_STEP_INDEX + 1) / STEPS.length) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted">{ACTIVE_STEP_INDEX + 1}/{STEPS.length} 진행</span>
          </div>
        </div>
      </div>
    </div>
  );
}
