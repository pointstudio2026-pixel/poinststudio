import { describe, expect, it, vi } from "vitest";
import { SelectColorPaletteUseCase } from "@/modules/colorPalettes/application/SelectColorPaletteUseCase";
import { FakeColorPaletteSelectionRepository } from "@/modules/colorPalettes/testing/fakes";
import { PRESET_COLOR_PALETTES } from "@/modules/colorPalettes/domain/ColorPalette";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { NotFoundError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

async function setup() {
  const projects = new FakeProjectRepository();
  const selections = new FakeColorPaletteSelectionRepository();
  const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Bakery" });
  return { projectId, projects, selections, useCase: new SelectColorPaletteUseCase(projects, selections) };
}

describe("SelectColorPaletteUseCase", () => {
  it("selects a preset palette and stores its swatches", async () => {
    const { projectId, useCase } = await setup();
    const preset = PRESET_COLOR_PALETTES[0]!;

    const selection = await useCase.execute({
      projectId,
      userId: "user-1",
      presetSlug: preset.slug,
    });

    expect(selection.presetSlug).toBe(preset.slug);
    expect(selection.swatches).toEqual(preset.swatches);
  });

  it("selects a custom palette and stores it with presetSlug null", async () => {
    const { projectId, useCase } = await setup();
    const customSwatches = [
      { hex: "#111111", label: "Custom 1" },
      { hex: "#222222", label: "Custom 2" },
    ];

    const selection = await useCase.execute({
      projectId,
      userId: "user-1",
      customSwatches,
    });

    expect(selection.presetSlug).toBeNull();
    expect(selection.swatches).toEqual(customSwatches);
  });

  it("append-only: reselecting adds a new selection, latest wins", async () => {
    const { projectId, selections, useCase } = await setup();
    const [first, second] = PRESET_COLOR_PALETTES;

    await useCase.execute({ projectId, userId: "user-1", presetSlug: first!.slug });
    await useCase.execute({ projectId, userId: "user-1", presetSlug: second!.slug });

    const latest = await selections.findLatestByProjectId(projectId);
    expect(latest?.presetSlug).toBe(second!.slug);
  });

  it("rejects an unknown preset slug", async () => {
    const { projectId, useCase } = await setup();

    await expect(
      useCase.execute({ projectId, userId: "user-1", presetSlug: "does-not-exist" }),
    ).rejects.toMatchObject({ code: "COLOR_PALETTE_NOT_FOUND" });
  });

  it("rejects a project the user doesn't own", async () => {
    const { projectId, useCase } = await setup();

    await expect(
      useCase.execute({ projectId, userId: "other-user", presetSlug: PRESET_COLOR_PALETTES[0]!.slug }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
