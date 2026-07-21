import type { ProjectUserStyleSelection } from "@/modules/userStyles/domain/UserStyle";

/** StyleSelectionRepository와 동일한 append-only 이력 패턴. */
export interface ProjectUserStyleSelectionRepository {
  create(projectId: string, userStyleCategoryId: string): Promise<ProjectUserStyleSelection>;
  findLatestByProjectId(projectId: string): Promise<ProjectUserStyleSelection | null>;
}
