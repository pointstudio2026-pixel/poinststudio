import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { ConceptBoardRepository } from "@/modules/conceptBoards/domain/ConceptBoardRepository";
import type { ConceptBoard } from "@/modules/conceptBoards/domain/ConceptBoard";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError } from "@/shared/errors/AppError";

export class RestoreConceptBoardVersionUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly conceptBoardRepository: ConceptBoardRepository,
  ) {}

  async execute(input: { projectId: string; userId: string; versionNumber: number }): Promise<ConceptBoard> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const existing = await this.conceptBoardRepository.findByProjectId(input.projectId);
    if (!existing) {
      throw new NotFoundError("Concept Board가 아직 생성되지 않았습니다.", "CONCEPT_BOARD_NOT_FOUND");
    }

    const target = await this.conceptBoardRepository.getVersion(existing.id, input.versionNumber);
    if (!target) {
      throw new NotFoundError("복원할 버전을 찾을 수 없습니다.", "CONCEPT_BOARD_VERSION_NOT_FOUND");
    }

    // 복원도 새 버전으로 기록한다 -- 히스토리에서 버전 3이 버전 1과 동일한
    // 내용이어도 "복원된 시점"이 그대로 남는다.
    const board = await this.conceptBoardRepository.addVersion(existing.id, target.data, "user");

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "CONCEPT_BOARD_RESTORED",
      payload: { restoredFrom: input.versionNumber, newVersion: board.currentVersion.versionNumber },
    });

    return board;
  }
}
