import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { ConceptBoardRepository } from "@/modules/conceptBoards/domain/ConceptBoardRepository";
import type { ConceptBoard, ConceptBoardData } from "@/modules/conceptBoards/domain/ConceptBoard";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError } from "@/shared/errors/AppError";

export class UpdateConceptBoardUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly conceptBoardRepository: ConceptBoardRepository,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
    patch: Partial<ConceptBoardData>;
  }): Promise<ConceptBoard> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const existing = await this.conceptBoardRepository.findByProjectId(input.projectId);
    if (!existing) {
      throw new NotFoundError("Concept Board가 아직 생성되지 않았습니다.", "CONCEPT_BOARD_NOT_FOUND");
    }

    // 항상 이전 버전 데이터 위에 패치를 얹어 새 버전을 만든다 -- 부분
    // 수정이어도 각 버전은 전체 스냅샷을 보존한다.
    const merged: ConceptBoardData = { ...existing.currentVersion.data, ...input.patch };
    const board = await this.conceptBoardRepository.addVersion(existing.id, merged, "user");

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "CONCEPT_BOARD_UPDATED",
      payload: { version: board.currentVersion.versionNumber },
    });

    return board;
  }
}
