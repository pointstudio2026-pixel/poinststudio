import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type { ColorSwatch } from "@/modules/colorPalettes/domain/ColorPalette";
import type { ColorPaletteSelection } from "@/modules/colorPalettes/domain/ColorPaletteSelection";
import type {
  ColorPaletteSelectionRepository,
  CreateColorPaletteSelectionInput,
} from "@/modules/colorPalettes/domain/ColorPaletteSelectionRepository";

function toSelection(row: {
  id: string;
  projectId: string;
  presetSlug: string | null;
  swatches: Prisma.JsonValue;
  createdAt: Date;
}): ColorPaletteSelection {
  return {
    id: row.id,
    projectId: row.projectId,
    presetSlug: row.presetSlug,
    swatches: row.swatches as unknown as ColorSwatch[],
    createdAt: row.createdAt,
  };
}

export class PrismaColorPaletteSelectionRepository implements ColorPaletteSelectionRepository {
  async create(input: CreateColorPaletteSelectionInput): Promise<ColorPaletteSelection> {
    const row = await prisma.colorPaletteSelection.create({
      data: {
        projectId: input.projectId,
        presetSlug: input.presetSlug,
        swatches: input.swatches as unknown as Prisma.InputJsonValue,
      },
    });
    return toSelection(row);
  }

  async findLatestByProjectId(projectId: string): Promise<ColorPaletteSelection | null> {
    const row = await prisma.colorPaletteSelection.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return row ? toSelection(row) : null;
  }
}
