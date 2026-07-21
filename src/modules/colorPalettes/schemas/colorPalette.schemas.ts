import { z } from "zod";

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "올바른 색상 코드가 아닙니다.");

const customSwatchSchema = z.object({
  hex: hexColorSchema,
  label: z.string().min(1).max(40),
});

export const selectColorPaletteSchema = z
  .object({
    presetSlug: z.string().min(1).optional(),
    customSwatches: z.array(customSwatchSchema).min(2).max(4).optional(),
  })
  .refine((data) => Boolean(data.presetSlug) !== Boolean(data.customSwatches), {
    message: "presetSlug 또는 customSwatches 중 하나만 지정해야 합니다.",
  });

export type SelectColorPaletteInput = z.infer<typeof selectColorPaletteSchema>;
