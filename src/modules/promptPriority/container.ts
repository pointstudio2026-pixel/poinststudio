import { PrismaPromptDecisionRecordRepository } from "@/modules/promptPriority/infrastructure/PrismaPromptDecisionRecordRepository";
import { RecordPromptDecisionUseCase } from "@/modules/promptPriority/application/RecordPromptDecisionUseCase";
import { ListPromptDecisionRecordsUseCase } from "@/modules/promptPriority/application/ListPromptDecisionRecordsUseCase";

export const promptDecisionRecordRepositoryInstance = new PrismaPromptDecisionRecordRepository();
const promptDecisionRecordRepository = promptDecisionRecordRepositoryInstance;

export const promptPriorityContainer = {
  promptDecisionRecordRepository,
  recordPromptDecisionUseCase: new RecordPromptDecisionUseCase(promptDecisionRecordRepository),
  listPromptDecisionRecordsUseCase: new ListPromptDecisionRecordsUseCase(promptDecisionRecordRepository),
};
