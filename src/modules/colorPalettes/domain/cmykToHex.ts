function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function toHexByte(v: number): string {
  return Math.round(clamp01(v) * 255)
    .toString(16)
    .padStart(2, "0");
}

/** c/m/y/k는 0~100 범위의 백분율 입력 -- 브랜드 컬러 직접입력의 CMYK 모드에서 사용. */
export function cmykToHex(c: number, m: number, y: number, k: number): string {
  const kFrac = clamp01(k / 100);
  const r = (1 - clamp01(c / 100)) * (1 - kFrac);
  const g = (1 - clamp01(m / 100)) * (1 - kFrac);
  const b = (1 - clamp01(y / 100)) * (1 - kFrac);
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
}
