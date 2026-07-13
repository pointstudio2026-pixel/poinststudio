import type {
  ConceptBoard,
  ConceptBoardData,
  ConceptBoardVersion,
  ConceptBoardVersionSource,
} from "@/modules/conceptBoards/domain/ConceptBoard";

export interface ConceptBoardRepository {
  findByProjectId(projectId: string): Promise<ConceptBoard | null>;
  /** Creates the board and its first version (v1) in one step. */
  createWithFirstVersion(
    projectId: string,
    data: ConceptBoardData,
    source: ConceptBoardVersionSource,
  ): Promise<ConceptBoard>;
  /** Appends a new version and makes it current -- never overwrites a prior version. */
  addVersion(
    conceptBoardId: string,
    data: ConceptBoardData,
    source: ConceptBoardVersionSource,
  ): Promise<ConceptBoard>;
  listVersions(conceptBoardId: string): Promise<ConceptBoardVersion[]>;
  getVersion(conceptBoardId: string, versionNumber: number): Promise<ConceptBoardVersion | null>;
}
