import { describe, expect, it } from "vitest";
import { RecommendMockupCategoriesUseCase } from "@/modules/mockups/application/RecommendMockupCategoriesUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { NotFoundError } from "@/shared/errors/AppError";

async function setupWithAnswers(answers: Record<string, string>) {
  const projects = new FakeProjectRepository();
  const interviews = new FakeInterviewRepository();
  const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Test" });

  const interview = await interviews.create(projectId);
  for (const [questionKey, answer] of Object.entries(answers)) {
    await interviews.saveAnswer(interview.id, { questionKey, questionText: questionKey, answer, sequence: 0 });
  }
  await interviews.complete(interview.id);

  return { projectId, useCase: new RecommendMockupCategoriesUseCase(projects, interviews) };
}

describe("RecommendMockupCategoriesUseCase", () => {
  it("recommends signboard first for a cafe storefront industry answer", async () => {
    const { projectId, useCase } = await setupWithAnswers({ industry: "카페", purpose: "매장 간판 디자인" });

    const recommendations = await useCase.execute({ projectId, userId: "user-1" });

    expect(recommendations[0]!.category).toBe("signboard");
  });

  it("returns categories in default order when there is no interview yet", async () => {
    const projects = new FakeProjectRepository();
    const interviews = new FakeInterviewRepository();
    const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Test" });
    const useCase = new RecommendMockupCategoriesUseCase(projects, interviews);

    const recommendations = await useCase.execute({ projectId, userId: "user-1" });

    expect(recommendations.every((r) => r.score === 0)).toBe(true);
  });

  it("rejects a project the user doesn't own", async () => {
    const { projectId, useCase } = await setupWithAnswers({ industry: "카페" });

    await expect(useCase.execute({ projectId, userId: "other-user" })).rejects.toBeInstanceOf(NotFoundError);
  });
});
