import { describe, expect, it } from "vitest";
import { FakeTrainingExampleRepository } from "@/modules/trainingExamples/testing/fakes";

/**
 * pruneAboveThreshold/pruneBelowThreshold/listCandidates는 순수 저장소가
 * 아니라 실제 분기 로직(초과분 계산, 정렬 방향)을 담고 있어 -- Prisma
 * 구현과 동일한 계약을 지키는지 여기서 직접 검증한다.
 */
describe("FakeTrainingExampleRepository capacity pruning", () => {
  it("pruneAboveThreshold deletes the lowest-scoring excess from the >= threshold bucket, leaving the below-threshold bucket untouched", async () => {
    const repo = new FakeTrainingExampleRepository();
    for (const score of [0.6, 0.7, 0.8, 0.9]) {
      await repo.create({
        prompt: `example-${score}`,
        deliverableType: "브랜딩 & 로고",
        createdByUserId: "admin-1",
        evaluationScore: score,
      });
    }
    await repo.create({
      prompt: "below-threshold example",
      deliverableType: "브랜딩 & 로고",
      createdByUserId: "admin-1",
      evaluationScore: 0.3,
    });

    const deleted = await repo.pruneAboveThreshold(0.6, 2);

    expect(deleted).toBe(2);
    const remainingScores = repo.examples.map((e) => e.evaluationScore).sort();
    expect(remainingScores).toEqual([0.3, 0.8, 0.9]);
  });

  it("pruneBelowThreshold deletes the highest-scoring (closest to threshold) excess from the < threshold bucket -- weaker/clearer avoid-examples survive", async () => {
    const repo = new FakeTrainingExampleRepository();
    for (const score of [0.1, 0.2, 0.4, 0.55]) {
      await repo.create({
        prompt: `example-${score}`,
        deliverableType: "브랜딩 & 로고",
        createdByUserId: "admin-1",
        evaluationScore: score,
      });
    }

    const deleted = await repo.pruneBelowThreshold(0.6, 2);

    expect(deleted).toBe(2);
    const remainingScores = repo.examples.map((e) => e.evaluationScore).sort();
    expect(remainingScores).toEqual([0.1, 0.2]);
  });

  it("prune methods are no-ops when the bucket is within capacity", async () => {
    const repo = new FakeTrainingExampleRepository();
    await repo.create({ prompt: "a", deliverableType: "브랜딩 & 로고", createdByUserId: "admin-1", evaluationScore: 0.9 });

    expect(await repo.pruneAboveThreshold(0.6, 10)).toBe(0);
    expect(repo.examples).toHaveLength(1);
  });

  it("listCandidates excludes a different-industry example but includes an industry-unspecified one", async () => {
    const repo = new FakeTrainingExampleRepository();
    await repo.create({
      prompt: "카페 대상",
      deliverableType: "브랜딩 & 로고",
      createdByUserId: "admin-1",
      evaluationScore: 0.9,
      industry: "카페/커피",
    });
    await repo.create({
      prompt: "병원 대상",
      deliverableType: "브랜딩 & 로고",
      createdByUserId: "admin-1",
      evaluationScore: 0.9,
      industry: "병원/의원/클리닉",
    });
    await repo.create({
      prompt: "업종 미지정",
      deliverableType: "브랜딩 & 로고",
      createdByUserId: "admin-1",
      evaluationScore: 0.9,
    });

    const results = await repo.listCandidates({
      deliverableType: "브랜딩 & 로고",
      category: "이미지생성",
      industry: "카페/커피",
      bucket: "above",
      threshold: 0.6,
      limit: 50,
    });

    expect(results.map((r) => r.prompt).sort()).toEqual(["업종 미지정", "카페 대상"]);
  });
});
