import { PrismaInterviewRepository } from "@/modules/interviews/infrastructure/PrismaInterviewRepository";
import { GetOrStartInterviewUseCase } from "@/modules/interviews/application/GetOrStartInterviewUseCase";
import { SaveAnswerUseCase } from "@/modules/interviews/application/SaveAnswerUseCase";
import { CompleteInterviewUseCase } from "@/modules/interviews/application/CompleteInterviewUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";

const interviewRepository = new PrismaInterviewRepository();

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
};
