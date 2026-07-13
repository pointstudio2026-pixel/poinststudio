import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { PromptRepository } from "@/modules/prompts/domain/PromptRepository";
import type { Prompt } from "@/modules/prompts/domain/Prompt";
import { NotFoundError } from "@/shared/errors/AppError";

export class GetPromptUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly promptRepository: PromptRepository,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<Prompt> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const prompt = await this.promptRepository.findByProjectId(input.projectId);
    if (!prompt) {
      throw new NotFoundError("Prompt가 아직 생성되지 않았습니다.", "PROMPT_NOT_FOUND");
    }

    return prompt;
  }
}
