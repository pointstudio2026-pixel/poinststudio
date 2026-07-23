import type { ColorSwatch } from "@/modules/colorPalettes/domain/ColorPalette";

export interface ColorPaletteSelection {
  id: string;
  projectId: string;
  /** 프리셋 선택이면 그 slug, 커스텀 hex 입력이면 null. */
  presetSlug: string | null;
  swatches: ColorSwatch[];
  /** 사용자가 명시적으로 배제한 색상(hex) -- 우선순위 시스템의 하드 제약조건. */
  forbiddenColors: string[];
  createdAt: Date;
}
