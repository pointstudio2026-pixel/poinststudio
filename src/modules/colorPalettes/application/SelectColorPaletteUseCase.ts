import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { ColorPaletteSelectionRepository } from "@/modules/colorPalettes/domain/ColorPaletteSelectionRepository";
import type { ColorPaletteSelection } from "@/modules/colorPalettes/domain/ColorPaletteSelection";
import type { SelectColorPaletteInput } from "@/modules/colorPalettes/schemas/colorPalette.schemas";
import { findPresetColorPalette } from "@/modules/colorPalettes/domain/ColorPalette";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

/**
 * SelectProjectUserStyleUseCase와 동일하게 어떤 워크스페이스 단계도 게이팅하지
 * 않는 순수 부가 선택이다 -- "스타일" 단계 화면에서 언제든 고르고 바꿀 수 있다.
 */
export class SelectColorPaletteUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly selectionRepository: ColorPaletteSelectionRepository,
  ) {}

  async execute(
    input: { projectId: string; userId: string } & SelectColorPaletteInput,
  ): Promise<ColorPaletteSelection> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    let presetSlug: string | null = null;
    let swatches;
    if (input.presetSlug) {
      const preset = findPresetColorPalette(input.presetSlug);
      if (!preset) {
        throw new NotFoundError("컬러 팔레트를 찾을 수 없습니다.", "COLOR_PALETTE_NOT_FOUND");
      }
      presetSlug = preset.slug;
      swatches = preset.swatches;
    } else {
      swatches = input.customSwatches!;
    }

    const forbiddenColors = input.forbiddenColors ?? [];
    const forbiddenSet = new Set(forbiddenColors.map((hex) => hex.toLowerCase()));
    const overlapping = swatches.filter((s) => forbiddenSet.has(s.hex.toLowerCase()));
    if (overlapping.length > 0) {
      throw new ValidationError(
        `"${overlapping.map((s) => s.label).join(", ")}"은(는) 선택한 색상이면서 동시에 금지 색상으로 지정됐습니다.`,
        undefined,
        "COLOR_PALETTE-001",
      );
    }

    const selection = await this.selectionRepository.create({
      projectId: input.projectId,
      presetSlug,
      swatches,
      forbiddenColors,
    });

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "COLOR_PALETTE_SELECTED",
      payload: { presetSlug },
    });

    return selection;
  }
}
