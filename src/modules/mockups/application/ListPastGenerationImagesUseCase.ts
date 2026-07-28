import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { PastGenerationImage } from "@/modules/generations/domain/Generation";

/** "목업" 단독 프로세스의 로고 첨부 단계 -- "직접 첨부" 대신 과거에 만든 로고 중에서 고를 때 쓴다. */
export class ListPastGenerationImagesUseCase {
  constructor(private readonly generationRepository: GenerationRepository) {}

  async execute(input: { userId: string }): Promise<PastGenerationImage[]> {
    return this.generationRepository.listCompletedImagesForUser(input.userId);
  }
}
