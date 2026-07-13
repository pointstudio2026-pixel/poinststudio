import { PrismaProjectRepository } from "@/modules/projects/infrastructure/PrismaProjectRepository";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { GetProjectUseCase } from "@/modules/projects/application/GetProjectUseCase";
import { ListProjectsUseCase } from "@/modules/projects/application/ListProjectsUseCase";

const projectRepository = new PrismaProjectRepository();

export const projectsContainer = {
  createProjectUseCase: new CreateProjectUseCase(projectRepository),
  getProjectUseCase: new GetProjectUseCase(projectRepository),
  listProjectsUseCase: new ListProjectsUseCase(projectRepository),
};
