import { describe, expect, it, vi } from "vitest";
import { CreateTrainingExampleUseCase } from "@/modules/trainingExamples/application/CreateTrainingExampleUseCase";
import { ListTrainingExamplesUseCase } from "@/modules/trainingExamples/application/ListTrainingExamplesUseCase";
import { DeleteTrainingExampleUseCase } from "@/modules/trainingExamples/application/DeleteTrainingExampleUseCase";
import { GetTrainingExampleImageUseCase } from "@/modules/trainingExamples/application/GetTrainingExampleImageUseCase";
import { FakeTrainingExampleRepository } from "@/modules/trainingExamples/testing/fakes";
import { FakeFileStorage } from "@/shared/storage/testing/FakeFileStorage";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

function setup() {
  const repository = new FakeTrainingExampleRepository();
  const fileStorage = new FakeFileStorage();
  return {
    repository,
    fileStorage,
    create: new CreateTrainingExampleUseCase(repository, fileStorage),
    list: new ListTrainingExamplesUseCase(repository),
    remove: new DeleteTrainingExampleUseCase(repository, fileStorage),
    getImage: new GetTrainingExampleImageUseCase(repository, fileStorage),
  };
}

const VALID_INPUT = {
  prompt: "카페 브랜드 로고, 미니멀 산세리프",
  deliverableType: "브랜딩 & 로고",
  imageData: Buffer.from("fake-image-bytes"),
  imageContentType: "image/png",
  createdByUserId: "admin-1",
};

describe("CreateTrainingExampleUseCase", () => {
  it("stores the image via FileStorage and persists the record (Vision AI를 호출하지 않는다 -- 이 유스케이스는 TextCompletionProvider를 아예 주입받지 않는 구조)", async () => {
    const ctx = setup();
    const example = await ctx.create.execute(VALID_INPUT);

    expect(example.prompt).toBe(VALID_INPUT.prompt);
    expect(example.deliverableType).toBe(VALID_INPUT.deliverableType);
    expect(ctx.repository.examples).toHaveLength(1);
    expect(ctx.fileStorage.files.size).toBe(1);
  });

  it("rejects an empty prompt", async () => {
    const ctx = setup();
    await expect(ctx.create.execute({ ...VALID_INPUT, prompt: "   " })).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects an unknown deliverableType", async () => {
    const ctx = setup();
    await expect(ctx.create.execute({ ...VALID_INPUT, deliverableType: "존재하지않는유형" })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("rejects a disallowed content type", async () => {
    const ctx = setup();
    await expect(
      ctx.create.execute({ ...VALID_INPUT, imageContentType: "image/gif" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects an image over the size limit", async () => {
    const ctx = setup();
    const oversized = Buffer.alloc(6 * 1024 * 1024);
    await expect(ctx.create.execute({ ...VALID_INPUT, imageData: oversized })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

describe("ListTrainingExamplesUseCase", () => {
  it("lists newest first", async () => {
    const ctx = setup();
    const first = await ctx.create.execute(VALID_INPUT);
    const second = await ctx.create.execute({ ...VALID_INPUT, prompt: "포스터 프롬프트", deliverableType: "포스터" });

    const list = await ctx.list.execute();
    expect(list.map((e) => e.id)).toEqual([second.id, first.id]);
  });
});

describe("DeleteTrainingExampleUseCase", () => {
  it("removes the record and its stored image", async () => {
    const ctx = setup();
    const example = await ctx.create.execute(VALID_INPUT);

    await ctx.remove.execute({ id: example.id, deletedByUserId: "admin-1" });

    expect(await ctx.repository.findById(example.id)).toBeNull();
    expect(ctx.fileStorage.files.size).toBe(0);
  });

  it("throws NotFoundError for an unknown id", async () => {
    const ctx = setup();
    await expect(ctx.remove.execute({ id: "missing", deletedByUserId: "admin-1" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("GetTrainingExampleImageUseCase", () => {
  it("returns the stored image bytes", async () => {
    const ctx = setup();
    const example = await ctx.create.execute(VALID_INPUT);

    const file = await ctx.getImage.execute({ id: example.id });
    expect(file.contentType).toBe("image/png");
    expect(file.data.toString()).toBe("fake-image-bytes");
  });
});
