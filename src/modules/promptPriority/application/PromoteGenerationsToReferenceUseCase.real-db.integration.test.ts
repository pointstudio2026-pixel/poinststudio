import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/shared/database/prisma";
import { PromoteGenerationsToReferenceUseCase } from "@/modules/promptPriority/application/PromoteGenerationsToReferenceUseCase";
import { PrismaGenerationEvaluationRepository } from "@/modules/generations/infrastructure/PrismaGenerationEvaluationRepository";
import { PrismaGenerationRepository } from "@/modules/generations/infrastructure/PrismaGenerationRepository";
import { PrismaGenerationFeedbackRepository } from "@/modules/generations/infrastructure/PrismaGenerationFeedbackRepository";
import { PrismaProjectRepository } from "@/modules/projects/infrastructure/PrismaProjectRepository";
import { PrismaInterviewRepository } from "@/modules/interviews/infrastructure/PrismaInterviewRepository";
import { PrismaPromptRepository } from "@/modules/prompts/infrastructure/PrismaPromptRepository";
import { PrismaPromptDecisionRecordRepository } from "@/modules/promptPriority/infrastructure/PrismaPromptDecisionRecordRepository";
import { PrismaTrainingExampleRepository } from "@/modules/trainingExamples/infrastructure/PrismaTrainingExampleRepository";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import type { HardConstraintSet, SoftPreferenceSet } from "@/modules/promptPriority/domain/HardConstraint";

const TEST_EMAIL_PREFIX = "promote-real-db-test";

const EMPTY_HARD_CONSTRAINTS: HardConstraintSet = {
  exactBrandName: "",
  forbiddenColors: [],
  requiredColors: [],
  forbiddenStyleNames: [],
  forbiddenLogoCategoryNames: [],
  forbiddenElements: [],
  requiredElements: [],
  purpose: [],
  freeTextConstraints: "",
};
const EMPTY_SOFT_PREFERENCES: SoftPreferenceSet = { moodWords: [] };

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
});

/**
 * FakeTrainingExampleRepository(단위 테스트에서 쓰는 인메모리 저장소)는 FK
 * 제약을 검증하지 않아서, PromoteGenerationsToReferenceUseCase가 실제로는
 * DB 제약 위반으로 매번 insert에 실패하는 버그(created_by_user_id가 User
 * FK인데 projectId를 넣고 있었음)를 682개 유닛 테스트 전부가 놓쳤다.
 * 이 테스트는 진짜 Prisma 리포지토리 + 진짜 Postgres로 그 경로를 검증해서
 * 같은 종류의 버그가 재발하면 여기서 잡히게 한다.
 */
describe("PromoteGenerationsToReferenceUseCase (real Prisma repositories, real Postgres)", () => {
  it("actually persists a below-threshold TrainingExample row with a valid createdByUserId FK, not just an in-memory record", async () => {
    const userRepository = new PrismaUserRepository();
    const user = await userRepository.create({
      email: `${TEST_EMAIL_PREFIX}-${Date.now()}@aster.dev`,
      passwordHash: await new Argon2PasswordHasher().hash("password123"),
      emailVerifiedAt: new Date(),
    });
    const project = await prisma.project.create({
      data: { userId: user.id, name: "Real DB Promotion Test", deliverableType: "포스터" },
    });

    const promptRepository = new PrismaPromptRepository();
    const prompt = await promptRepository.createWithFirstVersion(project.id, {
      provider: "openai",
      systemPrompt: "system",
      userPrompt: "a real-db below-threshold prompt",
      hash: `hash-${Date.now()}`,
      payload: {
        provider: "openai",
        model: "gpt-image-2",
        systemPrompt: "system",
        userPrompt: "a real-db below-threshold prompt",
        sizePreset: "square",
        parameters: {},
      },
      flaggedTerms: [],
    });

    const decisionRecordRepository = new PrismaPromptDecisionRecordRepository();
    await decisionRecordRepository.create({
      promptVersionId: prompt.currentVersion.id,
      hardConstraints: EMPTY_HARD_CONSTRAINTS,
      softPreferences: EMPTY_SOFT_PREFERENCES,
      dbCandidatesFound: [],
      dbCandidatesUsed: [],
      conflicts: [],
      complianceCheck: { passed: true, issues: [] },
    });

    const generationRepository = new PrismaGenerationRepository();
    const generation = await generationRepository.createWithFirstVersion(project.id, {
      promptVersionId: prompt.currentVersion.id,
    });
    await generationRepository.updateVersionResult(generation.currentVersion.id, {
      status: "completed",
      images: [{ url: "data:image/png;base64,AAA", thumbnailUrl: "t" }],
      completedAt: new Date(),
    });

    const feedbackRepository = new PrismaGenerationFeedbackRepository();
    await feedbackRepository.upsert({
      generationVersionId: generation.currentVersion.id,
      likedTags: [],
      dislikedTags: ["너무 복잡해요"],
      freeText: null,
    });

    const useCase = new PromoteGenerationsToReferenceUseCase(
      new PrismaGenerationEvaluationRepository(),
      generationRepository,
      feedbackRepository,
      new PrismaProjectRepository(),
      new PrismaInterviewRepository(),
      promptRepository,
      decisionRecordRepository,
      new PrismaTrainingExampleRepository(),
      userRepository,
    );

    // 사용자가 아쉬운 점만 선택함(disliked-only) -> 0점, 0.6 미만이라 "회피" 버킷에 저장돼야 한다.
    const result = await useCase.execute();

    expect(result.promoted).toBeGreaterThanOrEqual(1);

    const stored = await prisma.trainingExample.findFirst({
      where: { sourceGenerationVersionId: generation.currentVersion.id },
    });
    expect(stored).not.toBeNull();
    expect(stored?.createdByUserId).toBe(user.id);
    expect(stored?.evaluationScore).toBeLessThan(0.6);
    expect(stored?.source).toBe("USER_GENERATION");

    await prisma.trainingExample.deleteMany({ where: { sourceGenerationVersionId: generation.currentVersion.id } });
  });
});
