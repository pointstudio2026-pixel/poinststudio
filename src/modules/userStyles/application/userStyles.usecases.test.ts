import { describe, expect, it, vi } from "vitest";
import { CreateUserStyleCategoryUseCase } from "@/modules/userStyles/application/CreateUserStyleCategoryUseCase";
import { AddReferenceImageUseCase } from "@/modules/userStyles/application/AddReferenceImageUseCase";
import { DeleteUserStyleCategoryUseCase } from "@/modules/userStyles/application/DeleteUserStyleCategoryUseCase";
import { ReanalyzeUserStyleCategoryUseCase } from "@/modules/userStyles/application/ReanalyzeUserStyleCategoryUseCase";
import { SelectProjectUserStyleUseCase } from "@/modules/userStyles/application/SelectProjectUserStyleUseCase";
import { ListUserStyleCategoriesUseCase } from "@/modules/userStyles/application/ListUserStyleCategoriesUseCase";
import {
  FakeProjectUserStyleSelectionRepository,
  FakeUserStyleCategoryRepository,
  FakeUserStyleReferenceRepository,
} from "@/modules/userStyles/testing/fakes";
import { FakeFileStorage } from "@/shared/storage/testing/FakeFileStorage";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import type { TextCompletionProvider, TextCompletionRequest } from "@/shared/ai/TextCompletionProvider";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

class FakeVisionProvider implements TextCompletionProvider {
  readonly name = "openai";
  async complete(_request: TextCompletionRequest) {
    return { text: "분석된 스타일 설명", provider: this.name, model: "fake-vision" };
  }
  async health() {
    return true;
  }
}

const SMALL_PNG = Buffer.from("fake-png-bytes");

async function setup() {
  const projects = new FakeProjectRepository();
  const categories = new FakeUserStyleCategoryRepository();
  const references = new FakeUserStyleReferenceRepository();
  const selections = new FakeProjectUserStyleSelectionRepository();
  const fileStorage = new FakeFileStorage();
  const visionProvider = new FakeVisionProvider();

  return {
    projects,
    categories,
    references,
    selections,
    fileStorage,
    create: new CreateUserStyleCategoryUseCase(categories),
    list: new ListUserStyleCategoriesUseCase(categories, references),
    delete: new DeleteUserStyleCategoryUseCase(categories, references, fileStorage),
    addImage: new AddReferenceImageUseCase(categories, references, fileStorage, visionProvider),
    reanalyze: new ReanalyzeUserStyleCategoryUseCase(categories, references, fileStorage, visionProvider),
    selectForProject: new SelectProjectUserStyleUseCase(projects, categories, selections),
  };
}

describe("CreateUserStyleCategoryUseCase", () => {
  it("creates a category owned by the requesting user", async () => {
    const { create } = await setup();
    const category = await create.execute({ userId: "user-1", name: "우리 브랜드 로고 스타일" });
    expect(category.userId).toBe("user-1");
    expect(category.description).toBeNull();
  });

  it("rejects an empty name", async () => {
    const { create } = await setup();
    await expect(create.execute({ userId: "user-1", name: "   " })).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects a name over 100 characters", async () => {
    const { create } = await setup();
    await expect(create.execute({ userId: "user-1", name: "a".repeat(101) })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

describe("AddReferenceImageUseCase", () => {
  it("saves the image, stores a reference, and analyzes the description (정상 업로드)", async () => {
    const { categories, addImage } = await setup();
    const category = await categories.create("user-1", "미니멀 로고");

    const updated = await addImage.execute({
      userId: "user-1",
      categoryId: category.id,
      data: SMALL_PNG,
      contentType: "image/png",
    });

    expect(updated.description).toBe("분석된 스타일 설명");
  });

  it("rejects an unsupported content type", async () => {
    const { categories, addImage } = await setup();
    const category = await categories.create("user-1", "미니멀 로고");
    await expect(
      addImage.execute({ userId: "user-1", categoryId: category.id, data: SMALL_PNG, contentType: "image/gif" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects an oversized image", async () => {
    const { categories, addImage } = await setup();
    const category = await categories.create("user-1", "미니멀 로고");
    const oversized = Buffer.alloc(6 * 1024 * 1024);
    await expect(
      addImage.execute({ userId: "user-1", categoryId: category.id, data: oversized, contentType: "image/png" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects a 6th image in the same category (MAX_REFERENCES_PER_CATEGORY)", async () => {
    const { categories, addImage } = await setup();
    const category = await categories.create("user-1", "미니멀 로고");
    for (let i = 0; i < 5; i++) {
      await addImage.execute({ userId: "user-1", categoryId: category.id, data: SMALL_PNG, contentType: "image/png" });
    }
    await expect(
      addImage.execute({ userId: "user-1", categoryId: category.id, data: SMALL_PNG, contentType: "image/png" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects access from a user who doesn't own the category (권한 검증)", async () => {
    const { categories, addImage } = await setup();
    const category = await categories.create("user-1", "미니멀 로고");
    await expect(
      addImage.execute({ userId: "someone-else", categoryId: category.id, data: SMALL_PNG, contentType: "image/png" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("ReanalyzeUserStyleCategoryUseCase", () => {
  it("rejects reanalysis when there are no reference images yet", async () => {
    const { categories, reanalyze } = await setup();
    const category = await categories.create("user-1", "미니멀 로고");
    await expect(reanalyze.execute({ userId: "user-1", categoryId: category.id })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("re-runs analysis over all existing images", async () => {
    const { categories, addImage, reanalyze } = await setup();
    const category = await categories.create("user-1", "미니멀 로고");
    await addImage.execute({ userId: "user-1", categoryId: category.id, data: SMALL_PNG, contentType: "image/png" });

    const result = await reanalyze.execute({ userId: "user-1", categoryId: category.id });
    expect(result.description).toBe("분석된 스타일 설명");
  });
});

describe("DeleteUserStyleCategoryUseCase", () => {
  it("deletes the category and its stored files (참고 이미지 row 자체는 DB의 onDelete: Cascade가 처리)", async () => {
    const { categories, addImage, delete: deleteCategory, fileStorage } = await setup();
    const category = await categories.create("user-1", "미니멀 로고");
    await addImage.execute({ userId: "user-1", categoryId: category.id, data: SMALL_PNG, contentType: "image/png" });

    await deleteCategory.execute({ userId: "user-1", categoryId: category.id });

    expect(await categories.findById(category.id)).toBeNull();
    expect(fileStorage.files.size).toBe(0);
  });

  it("rejects deleting a category owned by someone else", async () => {
    const { categories, delete: deleteCategory } = await setup();
    const category = await categories.create("user-1", "미니멀 로고");
    await expect(
      deleteCategory.execute({ userId: "someone-else", categoryId: category.id }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("ListUserStyleCategoriesUseCase (계정 전체 재사용)", () => {
  it("returns every category for the user with its references, regardless of which project asks", async () => {
    const { categories, addImage, list } = await setup();
    const category = await categories.create("user-1", "미니멀 로고");
    await addImage.execute({ userId: "user-1", categoryId: category.id, data: SMALL_PNG, contentType: "image/png" });
    await categories.create("someone-else", "다른 사용자 스타일");

    const result = await list.execute({ userId: "user-1" });
    expect(result).toHaveLength(1);
    expect(result[0]!.references).toHaveLength(1);
  });
});

describe("SelectProjectUserStyleUseCase", () => {
  it("records a selection linking the project to the user's category", async () => {
    const { projects, categories, selectForProject } = await setup();
    const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Bakery" });
    const category = await categories.create("user-1", "미니멀 로고");

    const selection = await selectForProject.execute({
      projectId,
      userId: "user-1",
      userStyleCategoryId: category.id,
    });

    expect(selection.userStyleCategoryId).toBe(category.id);
  });

  it("rejects selecting another user's category", async () => {
    const { projects, categories, selectForProject } = await setup();
    const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Bakery" });
    const category = await categories.create("someone-else", "다른 사용자 스타일");

    await expect(
      selectForProject.execute({ projectId, userId: "user-1", userStyleCategoryId: category.id }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
