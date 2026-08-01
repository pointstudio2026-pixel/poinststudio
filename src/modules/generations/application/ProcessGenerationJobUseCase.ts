import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { PromptRepository } from "@/modules/prompts/domain/PromptRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { GenerationEvaluationRepository } from "@/modules/generations/domain/GenerationEvaluationRepository";
import type { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import type { PromptDecisionRecordRepository } from "@/modules/promptPriority/domain/PromptDecisionRecordRepository";
import type { EvaluateGenerationVisionUseCase } from "@/modules/generations/application/EvaluateGenerationVisionUseCase";
import type { GenerateFromLogoAssetUseCase } from "@/modules/generations/application/GenerateFromLogoAssetUseCase";
import type { ProjectLogoAssetRepository } from "@/modules/projectLogos/domain/ProjectLogoAssetRepository";
import { resolveImageGenerationProvider } from "@/shared/ai/imageGenerationRouter";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import { getWorkspaceSteps } from "@/modules/projects/domain/Project";
import { recordActivity } from "@/shared/activity/activityLogger";
import { logger } from "@/shared/logging/logger";

// 로딩 시간을 줄이기 위해 한 번에 1장만 생성한다 -- 대신 프로젝트당 최대
// 3개까지 "원클릭 수정" 프리셋으로 결과를 누적할 수 있다(resultCap.ts).
const IMAGES_PER_GENERATION = 1;

/**
 * The actual generation work, run inside the BullMQ Worker (never inside a
 * Route Handler -- 30_CLAUDE.md / Task-013's explicit mandate). Kept as a
 * plain Use Case so it's testable against fakes without a real queue/Redis.
 */
export class ProcessGenerationJobUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly promptRepository: PromptRepository,
    private readonly generationRepository: GenerationRepository,
    private readonly recordUsageUseCase: RecordUsageUseCase,
    private readonly promptDecisionRecordRepository: PromptDecisionRecordRepository,
    private readonly generationEvaluationRepository: GenerationEvaluationRepository,
    private readonly evaluateGenerationVisionUseCase: EvaluateGenerationVisionUseCase,
    private readonly projectLogoAssetRepository: ProjectLogoAssetRepository,
    private readonly generateFromLogoAssetUseCase: GenerateFromLogoAssetUseCase,
  ) {}

  async execute(input: {
    generationVersionId: string;
    isFinalAttempt: boolean;
    requestedByUserId: string;
  }): Promise<void> {
    const version = await this.generationRepository.getVersionById(input.generationVersionId);
    if (!version) return;
    const generation = await this.generationRepository.findById(version.generationId);
    if (!generation) return;

    await this.generationRepository.updateVersionResult(version.id, { status: "processing" });

    const promptVersion = await this.promptRepository.getVersionById(version.promptVersionId);
    if (!promptVersion) {
      await this.generationRepository.updateVersionResult(version.id, {
        status: "failed",
        errorMessage: "연결된 Prompt 버전을 찾을 수 없습니다.",
      });
      return;
    }

    try {
      // 프로젝트에 실제 로고가 첨부·확정돼 있으면(브랜딩 & 로고 외 유형에서
      // "로고 직접 첨부" 후 "첨부하기"까지 눌러 확정한 경우) AI가 텍스트만
      // 으로 로고를 상상해 그리는 대신, 로고 없는 경우와 동일한 프롬프트로
      // 매번 새 장면을 생성하되 그 로고만 실제 그대로 보존한다
      // (GenerateFromLogoAssetUseCase). confirmed가 아니면(드롭존에
      // 파일만 올려두고 확정 없이 이동한 경우) 로고가 없을 때와 완전히
      // 동일하게 취급한다 -- 2026-08-01 버그 수정, confirmed 없이 자산
      // 존재만으로 분기하면 안 됨. 반환 형태가 일반 이미지 생성과 동일해서
      // 이 아래 로직(Vision 평가/사용량 기록/currentStep 전진/최종 완료
      // 처리)은 어느 경로든 손댈 필요가 없다.
      const project = await this.projectRepository.findById(generation.projectId);
      const logoAsset = project ? await this.projectLogoAssetRepository.findByProjectId(project.id) : null;
      const result =
        project && logoAsset?.confirmed
          ? await this.generateFromLogoAssetUseCase.execute({
              logoAsset,
              systemPrompt: promptVersion.systemPrompt,
              userPrompt: promptVersion.userPrompt,
              sizePreset: promptVersion.payload.sizePreset,
            })
          : await resolveImageGenerationProvider(version.providerPreference).generate({
              systemPrompt: promptVersion.systemPrompt,
              userPrompt: promptVersion.userPrompt,
              count: IMAGES_PER_GENERATION,
              sizePreset: promptVersion.payload.sizePreset,
            });

      // 프롬프트 조립 시점에 이미 계산해둔 텍스트 레벨 준수 검증 결과를
      // 생성 결과에도 남긴다 -- 이미지 자체는 검증하지 않는다(비용 없음,
      // status로 명시). PromptDecisionRecord가 없으면(하드제약 없는
      // 기존 프로젝트) 조용히 생략한다.
      const decisionRecord = await this.promptDecisionRecordRepository.findByPromptVersionId(
        version.promptVersionId,
      );
      if (decisionRecord) {
        const evaluation = await this.generationEvaluationRepository.create({
          generationVersionId: version.id,
          status: "PROMPT_LEVEL_ONLY",
          hardConstraintPassed: decisionRecord.complianceCheck.passed,
          issues: decisionRecord.complianceCheck.issues,
        });

        // Vision AI(GPT) 판단 -- 이미지 + 프롬프트 + 브랜드 인터뷰를 비교해
        // 실제로 잘 수행됐는지 평가한다(2026-07-24 사용자 승인). best-effort:
        // 실패해도(네트워크 오류 등) 여기서 조용히 삼켜지므로 생성 자체는
        // 항상 완료 처리된다.
        const firstImage = result.images[0];
        if (firstImage) {
          await this.evaluateGenerationVisionUseCase.execute({
            generationEvaluationId: evaluation.id,
            projectId: generation.projectId,
            promptVersionId: version.promptVersionId,
            imageUrl: firstImage.url,
            imagePromptText: promptVersion.userPrompt,
          });
        }
      }

      if (project) {
        await this.recordUsageUseCase.execute({
          userId: input.requestedByUserId,
          projectId: generation.projectId,
          eventType: GENERATION_EVENT_TYPE,
          quantity: 1,
          costAmount: result.costAmount,
          metadata: { source: "generation", provider: result.provider },
        });

        const steps = getWorkspaceSteps(project.deliverableType);
        const stepIndex = steps.findIndex((s) => s.key === "generation");
        const nextStep = steps[stepIndex + 1];
        if (nextStep && project.currentStep === "generation") {
          await this.projectRepository.save({ ...project, currentStep: nextStep.key, updatedAt: new Date() });
        }

        await recordActivity({
          userId: input.requestedByUserId,
          projectId: generation.projectId,
          eventType: "GENERATION_COMPLETED",
          payload: { generationVersionId: version.id, imageCount: result.images.length },
        });
      }

      // 상태를 "completed"로 표시하는 시점을 currentStep 전진 이후로 미룬다 --
      // 그래야 폴링 중인 클라이언트가 completed 상태를 관측했을 때 project의
      // currentStep도 이미 다음 단계로 넘어가 있음이 보장된다(둘을 따로
      // 읽는 클라이언트 입장에서의 경쟁 상태 방지).
      await this.generationRepository.updateVersionResult(version.id, {
        status: "completed",
        provider: result.provider,
        images: result.images,
        costAmount: result.costAmount,
        completedAt: new Date(),
      });
    } catch (err) {
      logger.error("Image generation job failed", {
        generationVersionId: version.id,
        isFinalAttempt: input.isFinalAttempt,
        details: err instanceof Error ? err.message : String(err),
      });

      if (!input.isFinalAttempt) {
        // Let BullMQ's retry/backoff handle it -- don't mark "failed" yet.
        throw err;
      }

      await this.generationRepository.updateVersionResult(version.id, {
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "이미지 생성에 실패했습니다.",
      });

      const project = await this.projectRepository.findById(generation.projectId);
      if (project) {
        await recordActivity({
          userId: input.requestedByUserId,
          projectId: generation.projectId,
          eventType: "GENERATION_FAILED",
          payload: { generationVersionId: version.id },
        });
      }
    }
  }
}
