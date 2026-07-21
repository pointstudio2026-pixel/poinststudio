import { PrismaUserStyleCategoryRepository } from "@/modules/userStyles/infrastructure/PrismaUserStyleCategoryRepository";
import { PrismaUserStyleReferenceRepository } from "@/modules/userStyles/infrastructure/PrismaUserStyleReferenceRepository";
import { PrismaProjectUserStyleSelectionRepository } from "@/modules/userStyles/infrastructure/PrismaProjectUserStyleSelectionRepository";
import { CreateUserStyleCategoryUseCase } from "@/modules/userStyles/application/CreateUserStyleCategoryUseCase";
import { ListUserStyleCategoriesUseCase } from "@/modules/userStyles/application/ListUserStyleCategoriesUseCase";
import { DeleteUserStyleCategoryUseCase } from "@/modules/userStyles/application/DeleteUserStyleCategoryUseCase";
import { AddReferenceImageUseCase } from "@/modules/userStyles/application/AddReferenceImageUseCase";
import { ReanalyzeUserStyleCategoryUseCase } from "@/modules/userStyles/application/ReanalyzeUserStyleCategoryUseCase";
import { SelectProjectUserStyleUseCase } from "@/modules/userStyles/application/SelectProjectUserStyleUseCase";
import { GetUserStyleReferenceImageUseCase } from "@/modules/userStyles/application/GetUserStyleReferenceImageUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { resolveFileStorage } from "@/shared/storage/fileStorageRouter";
import { resolveTextCompletionProvider } from "@/shared/ai/textCompletionRouter";

export const userStyleCategoryRepositoryInstance = new PrismaUserStyleCategoryRepository();
export const userStyleReferenceRepositoryInstance = new PrismaUserStyleReferenceRepository();
export const projectUserStyleSelectionRepositoryInstance = new PrismaProjectUserStyleSelectionRepository();
const fileStorage = resolveFileStorage();

export const userStylesContainer = {
  createUserStyleCategoryUseCase: new CreateUserStyleCategoryUseCase(userStyleCategoryRepositoryInstance),
  listUserStyleCategoriesUseCase: new ListUserStyleCategoriesUseCase(
    userStyleCategoryRepositoryInstance,
    userStyleReferenceRepositoryInstance,
  ),
  deleteUserStyleCategoryUseCase: new DeleteUserStyleCategoryUseCase(
    userStyleCategoryRepositoryInstance,
    userStyleReferenceRepositoryInstance,
    fileStorage,
  ),
  // 비전 분석은 OpenAI만 지원하므로 명시적으로 "openai"를 선호(preferred)한다 --
  // 키가 없으면 라우터가 그대로 Mock으로 떨어지고, analyzeStyleReferenceImages가
  // provider.name !== "openai"를 감지해 이미지 분석 없이 null을 반환한다.
  addReferenceImageUseCase: new AddReferenceImageUseCase(
    userStyleCategoryRepositoryInstance,
    userStyleReferenceRepositoryInstance,
    fileStorage,
    resolveTextCompletionProvider("openai"),
  ),
  reanalyzeUserStyleCategoryUseCase: new ReanalyzeUserStyleCategoryUseCase(
    userStyleCategoryRepositoryInstance,
    userStyleReferenceRepositoryInstance,
    fileStorage,
    resolveTextCompletionProvider("openai"),
  ),
  selectProjectUserStyleUseCase: new SelectProjectUserStyleUseCase(
    projectRepositoryInstance,
    userStyleCategoryRepositoryInstance,
    projectUserStyleSelectionRepositoryInstance,
  ),
  getUserStyleReferenceImageUseCase: new GetUserStyleReferenceImageUseCase(
    userStyleCategoryRepositoryInstance,
    userStyleReferenceRepositoryInstance,
    fileStorage,
  ),
};

export { fileStorage as userStylesFileStorage };
