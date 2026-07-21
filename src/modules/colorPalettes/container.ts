import { PrismaColorPaletteSelectionRepository } from "@/modules/colorPalettes/infrastructure/PrismaColorPaletteSelectionRepository";
import { ListColorPalettesUseCase } from "@/modules/colorPalettes/application/ListColorPalettesUseCase";
import { SelectColorPaletteUseCase } from "@/modules/colorPalettes/application/SelectColorPaletteUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";

export const colorPaletteSelectionRepositoryInstance = new PrismaColorPaletteSelectionRepository();

export const colorPalettesContainer = {
  listColorPalettesUseCase: new ListColorPalettesUseCase(),
  selectColorPaletteUseCase: new SelectColorPaletteUseCase(
    projectRepositoryInstance,
    colorPaletteSelectionRepositoryInstance,
  ),
};
