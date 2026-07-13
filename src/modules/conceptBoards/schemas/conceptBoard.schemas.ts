import { z } from "zod";
import { CONCEPT_BOARD_SECTIONS } from "@/modules/conceptBoards/domain/ConceptBoard";

const colorSwatchSchema = z.object({ hex: z.string().min(1), label: z.string().min(1) });

export const updateConceptBoardSchema = z
  .object({
    heroImageUrl: z.string().nullable().optional(),
    brandSummary: z.string().optional(),
    coreValues: z.array(z.string()).optional(),
    styleKeywords: z.array(z.string()).optional(),
    colorPalette: z.array(colorSwatchSchema).optional(),
    typographyDirection: z.string().optional(),
    logoConceptImageUrls: z.array(z.string()).optional(),
    designNotes: z.string().optional(),
    sectionOrder: z.array(z.enum(CONCEPT_BOARD_SECTIONS)).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "변경할 값이 없습니다." });

export const restoreConceptBoardVersionSchema = z.object({
  versionNumber: z.number().int().positive(),
});
