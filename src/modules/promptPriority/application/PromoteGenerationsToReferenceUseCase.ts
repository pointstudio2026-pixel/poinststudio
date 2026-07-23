import type { GenerationEvaluationRepository } from "@/modules/generations/domain/GenerationEvaluationRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { GenerationFeedbackRepository } from "@/modules/generations/domain/GenerationFeedbackRepository";
import type { ExportRepository } from "@/modules/exports/domain/ExportRepository";
import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { PromptRepository } from "@/modules/prompts/domain/PromptRepository";
import type { TrainingExampleRepository } from "@/modules/trainingExamples/domain/TrainingExampleRepository";
import type { FileStorage } from "@/shared/storage/FileStorage";
import { getWorkspaceSteps } from "@/modules/projects/domain/Project";
import { computeGenerationUsageScore, REFERENCE_PROMOTION_THRESHOLD } from "@/modules/promptPriority/domain/generationUsageScore";

/** DB 용량 상한(§6) -- 넘으면 점수 낮은 자료부터 초과분만큼 자동 삭제. */
const DEFAULT_CAPACITY = 500;
function getCapacity(): number {
  const raw = process.env.TRAINING_EXAMPLE_CAPACITY;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CAPACITY;
}

/**
 * 관리자 수동 트리거(§6) -- 아직 평가 안 된(usageScore=null) 완료 생성물을
 * 비용 없는 행동 신호로 평가하고, 80점 이상만 참고 DB(TrainingExample,
 * source:"USER_GENERATION")로 승격한다. Vision AI 호출 없음, AI 비용 0.
 * Phase 1은 스케줄러 없이 이 유스케이스를 관리자가 버튼으로 직접 실행한다.
 */
export class PromoteGenerationsToReferenceUseCase {
  constructor(
    private readonly generationEvaluationRepository: GenerationEvaluationRepository,
    private readonly generationRepository: GenerationRepository,
    private readonly generationFeedbackRepository: GenerationFeedbackRepository,
    private readonly exportRepository: ExportRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly promptRepository: PromptRepository,
    private readonly trainingExampleRepository: TrainingExampleRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: { limit?: number } = {}): Promise<{ evaluated: number; promoted: number }> {
    const unscored = await this.generationEvaluationRepository.listUnscored(input.limit ?? 50);
    let promoted = 0;

    for (const evaluation of unscored) {
      const version = await this.generationRepository.getVersionById(evaluation.generationVersionId);
      if (!version || version.status !== "completed" || version.images.length === 0) continue;
      const generation = await this.generationRepository.findById(version.generationId);
      if (!generation) continue;
      const project = await this.projectRepository.findById(generation.projectId);
      if (!project) continue;

      const feedback = await this.generationFeedbackRepository.findByGenerationVersionId(version.id);
      const siblingVersions = await this.generationRepository.listVersions(generation.id);
      const maxVersionNumber = Math.max(...siblingVersions.map((v) => v.versionNumber));
      // 이 결과 이후 새 버전이 또 생겼다는 건(수정/재시도) 사용자가 이 결과에
      // 완전히 만족하지 못했을 가능성이 있다는 저렴한 대리 신호.
      const wasRetried = version.versionNumber < maxVersionNumber;

      const exportJobs = await this.exportRepository.listByProjectId(generation.projectId);
      const wasExported = exportJobs.some((job) => job.sourceRefId === version.id && job.status === "completed");

      const steps = getWorkspaceSteps(project.deliverableType);
      const mockupIndex = steps.findIndex((s) => s.key === "mockup");
      const currentIndex = steps.findIndex((s) => s.key === project.currentStep);
      const projectReachedMockupStage = mockupIndex >= 0 && currentIndex >= mockupIndex;

      const usageScore = computeGenerationUsageScore({
        feedback: feedback ? { likedTags: feedback.likedTags, dislikedTags: feedback.dislikedTags } : null,
        wasRetried,
        wasExported,
        projectReachedMockupStage,
      });

      const shouldPromote = usageScore >= REFERENCE_PROMOTION_THRESHOLD;
      await this.generationEvaluationRepository.updateUsageScore(evaluation.id, usageScore, shouldPromote);

      if (!shouldPromote) continue;

      const prompt = await this.promptRepository.getVersionById(version.promptVersionId);
      if (!prompt) continue;

      const image = version.images[0]!;
      const uploaded = await this.uploadImageFromUrl(image.url);
      if (!uploaded) continue;

      await this.trainingExampleRepository.create({
        prompt: prompt.userPrompt,
        deliverableType: project.deliverableType ?? "브랜딩 & 로고",
        imageStorageKey: uploaded.key,
        imageContentType: uploaded.contentType,
        createdByUserId: generation.projectId, // 실사용자 프로젝트에서 승격된 것이라 실제 관리자 계정이 없음 -- projectId로 출처를 표시.
        source: "USER_GENERATION",
        sourceGenerationVersionId: version.id,
      });
      promoted += 1;
    }

    // 용량 관리: 총 개수가 상한을 넘으면 점수 낮은 자료부터 초과분만큼 삭제.
    const all = await this.trainingExampleRepository.list();
    const capacity = getCapacity();
    if (all.length > capacity) {
      await this.trainingExampleRepository.deleteLowestScoring(all.length - capacity);
    }

    return { evaluated: unscored.length, promoted };
  }

  /** GeneratedImage.url은 provider 응답 형태에 따라 data: URL 또는 실제 원격 URL일 수 있다 -- 둘 다 FileStorage에 다시 저장해야 TrainingExample의 인증된 이미지 서빙 규약(§ FileStorage 패턴)을 따를 수 있다. */
  private async uploadImageFromUrl(url: string): Promise<{ key: string; contentType: string } | null> {
    try {
      let buffer: Buffer;
      let contentType: string;
      if (url.startsWith("data:")) {
        const match = /^data:([^;]+);base64,(.+)$/.exec(url);
        if (!match) return null;
        contentType = match[1]!;
        buffer = Buffer.from(match[2]!, "base64");
      } else {
        const response = await fetch(url);
        if (!response.ok) return null;
        contentType = response.headers.get("content-type") ?? "image/png";
        buffer = Buffer.from(await response.arrayBuffer());
      }
      const key = `training-examples/promoted-${crypto.randomUUID()}`;
      const saved = await this.fileStorage.save(key, buffer, contentType);
      return { key: saved.key, contentType };
    } catch {
      return null;
    }
  }
}
