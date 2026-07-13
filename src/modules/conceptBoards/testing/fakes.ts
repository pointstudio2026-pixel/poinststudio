import type {
  ConceptBoard,
  ConceptBoardData,
  ConceptBoardVersion,
  ConceptBoardVersionSource,
} from "@/modules/conceptBoards/domain/ConceptBoard";
import type { ConceptBoardRepository } from "@/modules/conceptBoards/domain/ConceptBoardRepository";

export class FakeConceptBoardRepository implements ConceptBoardRepository {
  boards = new Map<string, { id: string; projectId: string }>();
  versions: ConceptBoardVersion[] = [];
  private nextBoardId = 1;
  private nextVersionId = 1;

  async findByProjectId(projectId: string): Promise<ConceptBoard | null> {
    const board = [...this.boards.values()].find((b) => b.projectId === projectId);
    if (!board) return null;
    const current = this.versions
      .filter((v) => v.conceptBoardId === board.id)
      .sort((a, b) => b.versionNumber - a.versionNumber)[0];
    if (!current) return null;
    return { id: board.id, projectId: board.projectId, currentVersion: current };
  }

  async createWithFirstVersion(
    projectId: string,
    data: ConceptBoardData,
    source: ConceptBoardVersionSource,
  ): Promise<ConceptBoard> {
    const id = `board-${this.nextBoardId++}`;
    this.boards.set(id, { id, projectId });
    const version: ConceptBoardVersion = {
      id: `board-version-${this.nextVersionId++}`,
      conceptBoardId: id,
      versionNumber: 1,
      data,
      source,
      createdAt: new Date(),
    };
    this.versions.push(version);
    return { id, projectId, currentVersion: version };
  }

  async addVersion(
    conceptBoardId: string,
    data: ConceptBoardData,
    source: ConceptBoardVersionSource,
  ): Promise<ConceptBoard> {
    const board = this.boards.get(conceptBoardId);
    if (!board) throw new Error("board not found");
    const lastVersionNumber = Math.max(
      0,
      ...this.versions.filter((v) => v.conceptBoardId === conceptBoardId).map((v) => v.versionNumber),
    );
    const version: ConceptBoardVersion = {
      id: `board-version-${this.nextVersionId++}`,
      conceptBoardId,
      versionNumber: lastVersionNumber + 1,
      data,
      source,
      createdAt: new Date(),
    };
    this.versions.push(version);
    return { id: conceptBoardId, projectId: board.projectId, currentVersion: version };
  }

  async listVersions(conceptBoardId: string): Promise<ConceptBoardVersion[]> {
    return this.versions
      .filter((v) => v.conceptBoardId === conceptBoardId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async getVersion(conceptBoardId: string, versionNumber: number): Promise<ConceptBoardVersion | null> {
    return (
      this.versions.find((v) => v.conceptBoardId === conceptBoardId && v.versionNumber === versionNumber) ?? null
    );
  }
}
