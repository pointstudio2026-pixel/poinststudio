import type { ColorPaletteSelection } from "@/modules/colorPalettes/domain/ColorPaletteSelection";
import type {
  ColorPaletteSelectionRepository,
  CreateColorPaletteSelectionInput,
} from "@/modules/colorPalettes/domain/ColorPaletteSelectionRepository";

export class FakeColorPaletteSelectionRepository implements ColorPaletteSelectionRepository {
  selections: ColorPaletteSelection[] = [];

  async create(input: CreateColorPaletteSelectionInput): Promise<ColorPaletteSelection> {
    const selection: ColorPaletteSelection = {
      id: `color-palette-selection-${this.selections.length + 1}`,
      projectId: input.projectId,
      presetSlug: input.presetSlug,
      swatches: input.swatches,
      createdAt: new Date(),
    };
    this.selections.push(selection);
    return selection;
  }

  async findLatestByProjectId(projectId: string): Promise<ColorPaletteSelection | null> {
    const matches = this.selections.filter((s) => s.projectId === projectId);
    return matches.length > 0 ? matches[matches.length - 1]! : null;
  }
}
