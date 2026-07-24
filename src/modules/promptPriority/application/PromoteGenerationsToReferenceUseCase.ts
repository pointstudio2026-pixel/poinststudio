import type { GenerationEvaluationRepository } from "@/modules/generations/domain/GenerationEvaluationRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { GenerationFeedbackRepository } from "@/modules/generations/domain/GenerationFeedbackRepository";
import type { ExportRepository } from "@/modules/exports/domain/ExportRepository";
import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import type { PromptRepository } from "@/modules/prompts/domain/PromptRepository";
import type { PromptDecisionRecordRepository } from "@/modules/promptPriority/domain/PromptDecisionRecordRepository";
import type { TrainingExampleRepository } from "@/modules/trainingExamples/domain/TrainingExampleRepository";
import { getWorkspaceSteps } from "@/modules/projects/domain/Project";
import { computeGenerationUsageScore, REFERENCE_PROMOTION_THRESHOLD } from "@/modules/promptPriority/domain/generationUsageScore";

/**
 * DB 용량 상한(사용자 결정 2026-07-24) -- 참고(60점 이상)/회피(60점 미만)
 * 버킷을 따로 관리한다. 프롬프트 텍스트만 저장하므로(이미지 없음) 이 정도
 * 규모는 사실상 무료라 넉넉하게 잡았다 -- 조회 성능은 listCandidates의
 * limit(상위 N개만 조회)이 총량과 무관하게 항상 보장한다.
 */
const ABOVE_THRESHOLD_CAPACITY = 20000;
const BELOW_THRESHOLD_CAPACITY = 10000;

/**
 * 관리자 수동 트리거(§6) -- 아직 평가 안 된(usageScore=null) 완료 생성물을
 * 비용 없는 행동 신호로 평가하고, 60점 이상만 참고 DB(TrainingExample,
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
    private readonly interviewRepository: InterviewRepository,
    private readonly promptRepository: PromptRepository,
    private readonly promptDecisionRecordRepository: PromptDecisionRecordRepository,
    private readonly trainingExampleRepository: TrainingExampleRepository,
  ) {}

  async execute(input: { limit?: number } = {}): Promise<{ evaluated: number; promoted: number }> {
    // 자가 치유: 정상 흐름이면 완료 처리 직후 바로 생기지만
    // (ProcessGenerationJobUseCase), 그 직후 배포/재시작 등으로 프로세스가
    // 끊기면 GenerationEvaluation 행 자체가 영구히 누락될 수 있다 -- 매
    // 실행마다 먼저 채워 넣어야 그런 생성물도 결국 평가 대상에 들어온다.
    const missingEvaluations = await this.generationRepository.listCompletedWithoutEvaluation(50);
    for (const version of missingEvaluations) {
      const decisionRecord = await this.promptDecisionRecordRepository.findByPromptVersionId(version.promptVersionId);
      if (!decisionRecord) continue;
      await this.generationEvaluationRepository.create({
        generationVersionId: version.id,
        status: "PROMPT_LEVEL_ONLY",
        hardConstraintPassed: decisionRecord.complianceCheck.passed,
        issues: decisionRecord.complianceCheck.issues,
      });
    }

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

      const meetsThreshold = usageScore >= REFERENCE_PROMOTION_THRESHOLD;
      await this.generationEvaluationRepository.updateUsageScore(evaluation.id, usageScore, meetsThreshold);

      // 점수와 무관하게 완료된 생성물은 전부 DB에 쌓는다(사용자 결정,
      // 2026-07-24: "모든 생성물들은 다 저장해, 점수 상관없이") -- 대신
      // 실제 프롬프트 조립 시점(scoreTrainingExample)에서 기준 미달
      // 자료는 후보에서 제외한다. 이러면 시간이 지날수록 실사용자 결과가
      // 쌓이면서도, 실제로 쓰이는 건 항상 기준을 넘은 것들뿐이라 전체
      // 품질이 점점 올라가는 구조가 된다. 즉시 삭제하지 않고 남겨두는 건
      // 나중에 기준선을 조정하거나 재평가할 여지를 남기기 위함이다.
      const prompt = await this.promptRepository.getVersionById(version.promptVersionId);
      if (!prompt) continue;

      // 프로젝트 인터뷰에 이미 있는 업종 답변을 그대로 태그로 남긴다 --
      // 실제 사용 시점(rankTrainingExamples)에도 이 값이 반영되도록.
      const interview = await this.interviewRepository.findLatestByProjectId(generation.projectId);
      const industry = interview?.answers.find((a) => a.questionKey === "industry")?.answer ?? null;

      // 관리자가 "왜 이 점수인지" 실제로 판단할 수 있도록, 이 예시 하나에
      // 실제로 반영된 신호를 그대로 서술한다(고정 문구가 아니라 매번 다른
      // 실제 근거) -- 사용자 요청 2026-07-24: "프롬프트를 해석까지 해주면
      // 좋겠다, 점수가 높고 낮은지 판단할 수 있도록".
      const signalNotes: string[] = [];
      if (feedback && (feedback.likedTags.length > 0 || feedback.dislikedTags.length > 0)) {
        if (feedback.likedTags.length > 0) signalNotes.push(`사용자가 좋았던 점으로 선택: ${feedback.likedTags.join(", ")}`);
        if (feedback.dislikedTags.length > 0) signalNotes.push(`사용자가 아쉬운 점으로 선택: ${feedback.dislikedTags.join(", ")}`);
      } else {
        signalNotes.push(wasRetried ? "이후 재시도/수정됨(만족스럽지 않았을 가능성)" : "재시도 없이 그대로 사용됨");
        signalNotes.push(wasExported ? "실제로 내보내기(export)함" : "아직 내보내지 않음");
        signalNotes.push(projectReachedMockupStage ? "목업 단계까지 진행함" : "목업 단계 전");
      }

      await this.trainingExampleRepository.create({
        prompt: prompt.userPrompt,
        deliverableType: project.deliverableType ?? "브랜딩 & 로고",
        createdByUserId: generation.projectId, // 실사용자 프로젝트에서 승격된 것이라 실제 관리자 계정이 없음 -- projectId로 출처를 표시.
        source: "USER_GENERATION",
        sourceGenerationVersionId: version.id,
        industry,
        evaluationScore: usageScore,
        evaluationBreakdown: {
          usageScore: { score: usageScore, note: signalNotes.join(" · ") },
        },
        evaluatedAt: new Date(),
      });
      promoted += 1;
    }

    // 용량 관리: 참고(60점 이상)/회피(60점 미만) 버킷을 각각 따로 관리 --
    // 참고 버킷은 낮은 점수부터, 회피 버킷은 threshold에 가까운(가장 덜
    // 나쁜) 것부터 삭제한다(사용자 결정: 점수가 낮을수록 회피 지침으로서
    // 가치가 크다).
    await this.trainingExampleRepository.pruneAboveThreshold(REFERENCE_PROMOTION_THRESHOLD, ABOVE_THRESHOLD_CAPACITY);
    await this.trainingExampleRepository.pruneBelowThreshold(REFERENCE_PROMOTION_THRESHOLD, BELOW_THRESHOLD_CAPACITY);

    return { evaluated: unscored.length, promoted };
  }
}
