import { describe, expect, it } from "vitest";
import { FakeIndustryRepository } from "@/modules/industries/testing/fakes";
import { SearchIndustriesUseCase } from "@/modules/industries/application/SearchIndustriesUseCase";
import {
  ListAllIndustriesUseCase,
  CreateIndustryUseCase,
  UpdateIndustryUseCase,
  DeleteIndustryUseCase,
} from "@/modules/industries/application/AdminIndustryUseCases";
import type { CreateIndustryInput, Industry } from "@/modules/industries/domain/Industry";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

const CAFE_INPUT: CreateIndustryInput = {
  name: "카페/커피",
  seoSlug: "coffee-shop",
  category: "F&B",
  description: "따뜻하고 아늑한 무드의 카페 브랜드",
  recommendedColors: ["#5C4033", "웜 브라운"],
  recommendedLogoStyles: ["모던", "오가닉"],
  recommendedTypography: ["손글씨 느낌의 스크립트체"],
  recommendedPersonality: ["따뜻한", "친근한"],
  recommendedKeywords: ["카페", "커피", "커피숍", "coffee"],
};

describe("SearchIndustriesUseCase", () => {
  it("returns all active industries for an empty query", async () => {
    const repo = new FakeIndustryRepository();
    await new CreateIndustryUseCase(repo).execute(CAFE_INPUT);
    const results = await new SearchIndustriesUseCase(repo).execute("");
    expect(results).toHaveLength(1);
  });

  it("matches on a recommendedKeywords entry not literally in the name (다중 키워드)", async () => {
    const repo = new FakeIndustryRepository();
    await new CreateIndustryUseCase(repo).execute(CAFE_INPUT);
    const results = await new SearchIndustriesUseCase(repo).execute("coffee");
    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe("카페/커피");
  });

  it("excludes inactive industries", async () => {
    const repo = new FakeIndustryRepository();
    const created = await new CreateIndustryUseCase(repo).execute(CAFE_INPUT);
    await new UpdateIndustryUseCase(repo).execute(created.id, { isActive: false });
    const results = await new SearchIndustriesUseCase(repo).execute("카페");
    expect(results).toHaveLength(0);
  });
});

describe("CreateIndustryUseCase", () => {
  it("rejects a duplicate name", async () => {
    const repo = new FakeIndustryRepository();
    await new CreateIndustryUseCase(repo).execute(CAFE_INPUT);
    await expect(new CreateIndustryUseCase(repo).execute(CAFE_INPUT)).rejects.toThrow(ValidationError);
  });
});

describe("UpdateIndustryUseCase / DeleteIndustryUseCase", () => {
  it("throws NotFoundError for an unknown id", async () => {
    const repo = new FakeIndustryRepository();
    await expect(new UpdateIndustryUseCase(repo).execute("missing-id", { category: "X" })).rejects.toThrow(
      NotFoundError,
    );
    await expect(new DeleteIndustryUseCase(repo).execute("missing-id")).rejects.toThrow(NotFoundError);
  });

  it("updates fields and removes the row on delete", async () => {
    const repo = new FakeIndustryRepository();
    const created = await new CreateIndustryUseCase(repo).execute(CAFE_INPUT);
    const updated = await new UpdateIndustryUseCase(repo).execute(created.id, { category: "음료" });
    expect(updated.category).toBe("음료");

    await new DeleteIndustryUseCase(repo).execute(created.id);
    const all: Industry[] = await new ListAllIndustriesUseCase(repo).execute();
    expect(all).toHaveLength(0);
  });
});
