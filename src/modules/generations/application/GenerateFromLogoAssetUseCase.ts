import type { ProjectLogoAsset } from "@/modules/projectLogos/domain/ProjectLogoAsset";
import type { LogoPreservingImageProvider } from "@/shared/ai/LogoPreservingImageProvider";
import type { ImageGenerationResult, SizePreset } from "@/shared/ai/ImageGenerationProvider";
import type { FileStorage } from "@/shared/storage/FileStorage";
import { InternalError } from "@/shared/errors/AppError";

/**
 * "이미지 생성" 단계에서 AI가 텍스트만으로 로고를 상상해 그리는 대신, 사용자가
 * 첨부한 실제 로고를 그대로 보존하면서 장면은 매번 새로 생성한다.
 *
 * 2026-08-01 재설계(사용자 지적): 이전 버전은 정해진 목업 카테고리 배경
 * 템플릿 중 하나를 무작위로 골라 그 위에 로고를 합성했다(고정 배경 +
 * Math.random 선택) -- 이건 "목업 대시보드"용 접근이지 프로젝트의 "이미지
 * 생성" 단계용이 아니다. 로고를 첨부했든 안 했든, 이 단계는 매번 브랜드
 * 인터뷰/스타일에 맞는 새로운 장면을 AI가 생성해야 한다(로고 없는 경우와
 * 동일한 동작). 그래서 이제 이 유스케이스는 목업 템플릿을 전혀 참조하지
 * 않고, BuildPromptUseCase가 로고 없는 경우와 동일하게 이미 만들어둔
 * systemPrompt/userPrompt를 그대로 받아 "이 로고는 다시 그리지 말고 그대로
 * 유지하라"는 지시만 덧붙인 뒤, 실제 픽셀을 보존하는 edit 호출
 * (LogoPreservingImageProvider)로 넘긴다.
 */
export class GenerateFromLogoAssetUseCase {
  constructor(
    private readonly fileStorage: FileStorage,
    private readonly logoPreservingProvider: LogoPreservingImageProvider,
  ) {}

  async execute(input: {
    logoAsset: ProjectLogoAsset;
    systemPrompt: string;
    userPrompt: string;
    sizePreset?: SizePreset;
  }): Promise<ImageGenerationResult> {
    const file = await this.fileStorage.read(input.logoAsset.storageKey);
    if (!file) {
      throw new InternalError("첨부된 로고 파일을 찾을 수 없습니다.");
    }
    const logoDataUri = `data:${file.contentType};base64,${file.data.toString("base64")}`;

    return this.logoPreservingProvider.generate({
      logoImageUrl: logoDataUri,
      systemPrompt: input.systemPrompt,
      userPrompt: input.userPrompt,
      sizePreset: input.sizePreset,
    });
  }
}
