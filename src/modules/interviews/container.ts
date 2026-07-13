import { PrismaInterviewRepository } from "@/modules/interviews/infrastructure/PrismaInterviewRepository";
import { GetOrStartInterviewUseCase } from "@/modules/interviews/application/GetOrStartInterviewUseCase";
import { SaveAnswerUseCase } from "@/modules/interviews/application/SaveAnswerUseCase";
import { CompleteInterviewUseCase } from "@/modules/interviews/application/CompleteInterviewUseCase";
import { GenerateFollowUpUseCase } from "@/modules/interviews/application/GenerateFollowUpUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { resolveTextCompletionProvider } from "@/shared/ai/textCompletionRouter";

export const interviewRepositoryInstance = new PrismaInterviewRepository();
const interviewRepository = interviewRepositoryInstance;

export const interviewsContainer = {
  getOrStartInterviewUseCase: new GetOrStartInterviewUseCase(
    projectRepositoryInstance,
    interviewRepository,
  ),
  saveAnswerUseCase: new SaveAnswerUseCase(projectRepositoryInstance, interviewRepository),
  completeInterviewUseCase: new CompleteInterviewUseCase(
    projectRepositoryInstance,
    interviewRepository,
  ),
  generateFollowUpUseCase: new GenerateFollowUpUseCase(
    projectRepositoryInstance,
    interviewRepository,
    resolveTextCompletionProvider(),
  ),
};
