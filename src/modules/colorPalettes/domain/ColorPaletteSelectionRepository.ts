import type { ColorSwatch } from "@/modules/colorPalettes/domain/ColorPalette";
import type { ColorPaletteSelection } from "@/modules/colorPalettes/domain/ColorPaletteSelection";

export interface CreateColorPaletteSelectionInput {
  projectId: string;
  presetSlug: string | null;
  swatches: ColorSwatch[];
}

export interface ColorPaletteSelectionRepository {
  /** Selection history is append-only -- reselecting adds a new row. */
  create(input: CreateColorPaletteSelectionInput): Promise<ColorPaletteSelection>;
  findLatestByProjectId(projectId: string): Promise<ColorPaletteSelection | null>;
}
