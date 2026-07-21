import { PRESET_COLOR_PALETTES, type ColorPalette } from "@/modules/colorPalettes/domain/ColorPalette";

export class ListColorPalettesUseCase {
  execute(): ColorPalette[] {
    return PRESET_COLOR_PALETTES;
  }
}
