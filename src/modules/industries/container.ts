import { PrismaIndustryRepository } from "@/modules/industries/infrastructure/PrismaIndustryRepository";
import { SearchIndustriesUseCase } from "@/modules/industries/application/SearchIndustriesUseCase";
import {
  ListAllIndustriesUseCase,
  CreateIndustryUseCase,
  UpdateIndustryUseCase,
  DeleteIndustryUseCase,
} from "@/modules/industries/application/AdminIndustryUseCases";

export const industryRepositoryInstance = new PrismaIndustryRepository();

export const industriesContainer = {
  searchIndustriesUseCase: new SearchIndustriesUseCase(industryRepositoryInstance),
  listAllIndustriesUseCase: new ListAllIndustriesUseCase(industryRepositoryInstance),
  createIndustryUseCase: new CreateIndustryUseCase(industryRepositoryInstance),
  updateIndustryUseCase: new UpdateIndustryUseCase(industryRepositoryInstance),
  deleteIndustryUseCase: new DeleteIndustryUseCase(industryRepositoryInstance),
};
