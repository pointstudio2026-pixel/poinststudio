import type { UserStyleCategoryRepository } from "@/modules/userStyles/domain/UserStyleCategoryRepository";
import type { UserStyleReferenceRepository } from "@/modules/userStyles/domain/UserStyleReferenceRepository";
import type { FileStorage } from "@/shared/storage/FileStorage";
import { NotFoundError } from "@/shared/errors/AppError";

/** DownloadExportUseCase와 동일한 패턴 -- 소유자 인증 확인 후 Buffer 스트리밍. */
export class GetUserStyleReferenceImageUseCase {
  constructor(
    private readonly categoryRepository: UserStyleCategoryRepository,
    private readonly referenceRepository: UserStyleReferenceRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: { userId: string; referenceId: string }): Promise<{ data: Buffer; contentType: string }> {
    const reference = await this.referenceRepository.findById(input.referenceId);
    if (!reference) {
      throw new NotFoundError("참고 이미지를 찾을 수 없습니다.", "USER_STYLE_REFERENCE_NOT_FOUND");
    }
    const category = await this.categoryRepository.findById(reference.categoryId);
    if (!category || category.userId !== input.userId) {
      throw new NotFoundError("참고 이미지를 찾을 수 없습니다.", "USER_STYLE_REFERENCE_NOT_FOUND");
    }

    const file = await this.fileStorage.read(reference.storageKey);
    if (!file) {
      throw new NotFoundError("이미지 파일을 찾을 수 없습니다.", "USER_STYLE_REFERENCE_FILE_NOT_FOUND");
    }

    return file;
  }
}
