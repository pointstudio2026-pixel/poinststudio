import { apiFetch } from "@/services/http-client";

export interface ColorSwatchDto {
  hex: string;
  label: string;
}

export interface ColorPaletteDto {
  slug: string;
  name: string;
  swatches: ColorSwatchDto[];
}

export interface ColorPaletteSelectionDto {
  id: string;
  projectId: string;
  presetSlug: string | null;
  swatches: ColorSwatchDto[];
  forbiddenColors: string[];
  createdAt: string;
}

export function fetchColorPalettes() {
  return apiFetch<{ palettes: ColorPaletteDto[] }>("/api/color-palettes");
}

export function selectColorPalette(
  projectId: string,
  input: ({ presetSlug: string } | { customSwatches: ColorSwatchDto[] }) & { forbiddenColors?: string[] },
) {
  return apiFetch<{ selection: ColorPaletteSelectionDto }>(`/api/projects/${projectId}/color-palette`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
