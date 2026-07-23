import { PrismaTrainingExampleRepository } from "@/modules/trainingExamples/infrastructure/PrismaTrainingExampleRepository";
import { CreateTrainingExampleUseCase } from "@/modules/trainingExamples/application/CreateTrainingExampleUseCase";
import { ListTrainingExamplesUseCase } from "@/modules/trainingExamples/application/ListTrainingExamplesUseCase";
import { DeleteTrainingExampleUseCase } from "@/modules/trainingExamples/application/DeleteTrainingExampleUseCase";
import { GetTrainingExampleImageUseCase } from "@/modules/trainingExamples/application/GetTrainingExampleImageUseCase";
import { resolveFileStorage } from "@/shared/storage/fileStorageRouter";

export const trainingExampleRepositoryInstance = new PrismaTrainingExampleRepository();
const trainingExampleRepository = trainingExampleRepositoryInstance;
const fileStorage = resolveFileStorage();

export const trainingExamplesContainer = {
  trainingExampleRepository,
  createTrainingExampleUseCase: new CreateTrainingExampleUseCase(trainingExampleRepository, fileStorage),
  listTrainingExamplesUseCase: new ListTrainingExamplesUseCase(trainingExampleRepository),
  deleteTrainingExampleUseCase: new DeleteTrainingExampleUseCase(trainingExampleRepository, fileStorage),
  getTrainingExampleImageUseCase: new GetTrainingExampleImageUseCase(trainingExampleRepository, fileStorage),
};
