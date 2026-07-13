import { PrismaProjectRepository } from "@/modules/projects/infrastructure/PrismaProjectRepository";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { GetProjectUseCase } from "@/modules/projects/application/GetProjectUseCase";
import { ListProjectsUseCase } from "@/modules/projects/application/ListProjectsUseCase";
import { UpdateProjectUseCase } from "@/modules/projects/application/UpdateProjectUseCase";
import { DeleteProjectUseCase } from "@/modules/projects/application/DeleteProjectUseCase";
import { GetProjectActivityUseCase } from "@/modules/projects/application/GetProjectActivityUseCase";

const projectRepository = new PrismaProjectRepository();

export const projectsContainer = {
  createProjectUseCase: new CreateProjectUseCase(projectRepository),
  getProjectUseCase: new GetProjectUseCase(projectRepository),
  listProjectsUseCase: new ListProjectsUseCase(projectRepository),
  updateProjectUseCase: new UpdateProjectUseCase(projectRepository),
  deleteProjectUseCase: new DeleteProjectUseCase(projectRepository),
  getProjectActivityUseCase: new GetProjectActivityUseCase(projectRepository),
};
