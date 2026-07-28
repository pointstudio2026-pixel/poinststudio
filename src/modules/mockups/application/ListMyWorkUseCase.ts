import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { StandaloneMockupRepository } from "@/modules/mockups/domain/StandaloneMockupRepository";
import type { MyWorkItem } from "@/modules/mockups/domain/MyWork";

const STANDALONE_MOCKUP_LIST_LIMIT = 200;

export class ListMyWorkUseCase {
  constructor(
    private readonly generationRepository: GenerationRepository,
    private readonly standaloneMockupRepository: StandaloneMockupRepository,
  ) {}

  async execute(userId: string): Promise<MyWorkItem[]> {
    const [pastGenerations, standaloneMockups] = await Promise.all([
      this.generationRepository.listCompletedImagesForUser(userId),
      this.standaloneMockupRepository.listByUserId(userId, STANDALONE_MOCKUP_LIST_LIMIT),
    ]);

    const generationItems: MyWorkItem[] = pastGenerations.map((img) => ({
      id: `generation-${img.generationVersionId}-${img.imageIndex}`,
      sourceType: "generation",
      imageUrl: img.url,
      thumbnailUrl: img.thumbnailUrl,
      projectName: img.projectName,
      createdAt: img.createdAt,
    }));

    // projectName은 일반 생성(사용자가 지은 실제 프로젝트 이름)에만 의미가
    // 있다 -- 목업 단독 프로세스는 화면 표시용 이름이 없는 껍데기 Project를
    // 쓰므로(raw name 노출 금지 원칙, StandaloneMockupView와 동일) 빈
    // 문자열로 두고 화면에서 sourceType 기준으로 번역된 라벨을 대신 쓴다.
    const standaloneItems: MyWorkItem[] = standaloneMockups
      .filter((m) => m.status === "completed" && m.resultImageUrl)
      .map((m) => ({
        id: `standalone-mockup-${m.id}`,
        sourceType: "standalone_mockup",
        imageUrl: m.resultImageUrl!,
        thumbnailUrl: m.thumbnailUrl ?? m.resultImageUrl!,
        projectName: "",
        createdAt: m.createdAt,
      }));

    return [...generationItems, ...standaloneItems].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
