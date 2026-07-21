import type { ColorSwatch } from "@/modules/colorPalettes/domain/ColorPalette";

export interface ColorPaletteSelection {
  id: string;
  projectId: string;
  /** 프리셋 선택이면 그 slug, 커스텀 hex 입력이면 null. */
  presetSlug: string | null;
  swatches: ColorSwatch[];
  createdAt: Date;
}
