import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { ConceptBoardRepository } from "@/modules/conceptBoards/domain/ConceptBoardRepository";
import type { ConceptBoard, ConceptBoardVersion } from "@/modules/conceptBoards/domain/ConceptBoard";
import { NotFoundError } from "@/shared/errors/AppError";

export interface GetConceptBoardOutput {
  board: ConceptBoard;
  versions: ConceptBoardVersion[];
}

export class GetConceptBoardUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly conceptBoardRepository: ConceptBoardRepository,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<GetConceptBoardOutput> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const board = await this.conceptBoardRepository.findByProjectId(input.projectId);
    if (!board) {
      throw new NotFoundError("Concept Board가 아직 생성되지 않았습니다.", "CONCEPT_BOARD_NOT_FOUND");
    }

    const versions = await this.conceptBoardRepository.listVersions(board.id);
    return { board, versions };
  }
}
