import type { GenerationEvaluationRepository } from "@/modules/generations/domain/GenerationEvaluationRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { GenerationFeedbackRepository } from "@/modules/generations/domain/GenerationFeedbackRepository";
import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import type { PromptRepository } from "@/modules/prompts/domain/PromptRepository";
import type { PromptDecisionRecordRepository } from "@/modules/promptPriority/domain/PromptDecisionRecordRepository";
import type { TrainingExampleRepository } from "@/modules/trainingExamples/domain/TrainingExampleRepository";
import {
  computeGenerationUsageScore,
  REFERENCE_PROMOTION_THRESHOLD,
  REFERENCE_PROMOTION_UPPER_THRESHOLD,
} from "@/modules/promptPriority/domain/generationUsageScore";

/**
 * DB 용량 상한(사용자 결정 2026-07-24) -- 참고(80점 이상)/회피(60점 미만)
 * 버킷을 따로 관리한다. 프롬프트 텍스트만 저장하므로(이미지 없음) 이 정도
 * 규모는 사실상 무료라 넉넉하게 잡았다 -- 조회 성능은 listCandidates의
 * limit(상위 N개만 조회)이 총량과 무관하게 항상 보장한다.
 */
const ABOVE_THRESHOLD_CAPACITY = 20000;
const BELOW_THRESHOLD_CAPACITY = 10000;

/**
 * 관리자 수동 트리거(§6) -- 아직 평가 안 된(usageScore=null) 완료 생성물을
 * 사용자가 직접 남긴 평가(GenerationFeedback)로 채점하고, 80점 이상만
 * 참고 DB(TrainingExample, source:"USER_GENERATION")로 승격하고 60점
 * 미만은 회피 자료로 저장한다. 60~79점은 애매한 신호로 보고 DB에 남기지
 * 않는다(2026-07-25). 재시도/내보내기/프로젝트 진행도 같은 행동 신호는
 * 더 이상 쓰지 않는다(2026-07-25 사용자 지시 -- "내보내기 안 했다고
 * 점수 깎는 건 아닌 것 같다": 그런 대리 신호는 실제 품질과 무관하게 감점될
 * 수 있어 잘못됐다). 평가가 아예 없으면 보통 점수(0.7, 저장 안 되는
 * 구간)로 처리해 애매한 자료가 쌓이지 않는다. Vision AI 호출 없음, AI
 * 비용 0(생성 직후 이미 채워진 Vision 판단이 있으면 평균으로 결합할 뿐,
 * 이 유스케이스 자체는 새 AI 호출을 하지 않는다). Phase 1은 스케줄러
 * 없이(다만 매일 자동 실행되는 referencePromotionWorker가 이미 이
 * 유스케이스를 24시간마다 자동 호출한다 -- "관리자가 버튼으로"는 그 사이
 * 즉시 확인하고 싶을 때 쓰는 수동 트리거다).
 */
export class PromoteGenerationsToReferenceUseCase {
  constructor(
    private readonly generationEvaluationRepository: GenerationEvaluationRepository,
    private readonly generationRepository: GenerationRepository,
    private readonly generationFeedbackRepository: GenerationFeedbackRepository,
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

      const behavioralScore = computeGenerationUsageScore({
        feedback: feedback ? { likedTags: feedback.likedTags, dislikedTags: feedback.dislikedTags } : null,
      });

      // Vision AI(GPT) 판단이 생성 직후 이미 채워져 있으면(2026-07-24 신규
      // 기능) 행동 신호와 동등 가중 평균으로 결합한다 -- 재시도 없이 그대로
      // 썼더라도(행동 신호는 좋음) 실제로 금지 요소가 그려졌거나 여러 시안이
      // 섞였다면(Vision 신호는 나쁨) 참고자료로는 부적합하다는 판단을 반영.
      // Vision 판단이 없는(아직 미실행/실패한) 기존 행은 행동 신호만으로
      // 그대로 판단한다(하위 호환).
      const finalScore =
        evaluation.visionScore != null
          ? Math.round(((evaluation.visionScore + behavioralScore) / 2) * 100) / 100
          : behavioralScore;

      // 80점 이상만 참고(reference)로 승격, 60점 미만만 회피(avoid)로 저장,
      // 그 사이(60~79점)는 "애매한" 신호라 DB에 아예 남기지 않는다(사용자
      // 재지시 2026-07-25 -- 이전엔 점수 무관 전량 저장이었으나, 그러면
      // 애매한 자료가 쌓여 실제로 DB가 잘 쌓이는지 판단하기 어렵다는 문제
      // 제기가 있었음).
      const promotedToReference = finalScore >= REFERENCE_PROMOTION_UPPER_THRESHOLD;
      const shouldStore = promotedToReference || finalScore < REFERENCE_PROMOTION_THRESHOLD;
      await this.generationEvaluationRepository.updateUsageScore(evaluation.id, finalScore, promotedToReference);
      if (!shouldStore) continue;

      const prompt = await this.promptRepository.getVersionById(version.promptVersionId);
      if (!prompt) continue;

      // 프로젝트 인터뷰에 이미 있는 업종 답변을 그대로 태그로 남긴다 --
      // 실제 사용 시점(rankTrainingExamples)에도 이 값이 반영되도록.
      const interview = await this.interviewRepository.findLatestByProjectId(generation.projectId);
      const industry = interview?.answers.find((a) => a.questionKey === "industry")?.answer ?? null;

      // 관리자가 "왜 이 점수인지" 실제로 판단할 수 있도록, 이 예시 하나에
      // 실제로 반영된 신호를 그대로 서술한다(고정 문구가 아니라 매번 다른
      // 실제 근거) -- 사용자 요청 2026-07-24: "프롬프트를 해석까지 해주면
      // 좋겠다, 점수가 높고 낮은지 판단할 수 있도록". feedback이 없으면(예:
      // Vision 판단만으로 finalScore가 기준을 넘긴 경우) 빈 문자열로 남고
      // 아래 visionQuality 항목이 실제 근거를 대신 설명한다.
      const signalNotes: string[] = [];
      if (feedback?.likedTags.length) signalNotes.push(`사용자가 좋았던 점으로 선택: ${feedback.likedTags.join(", ")}`);
      if (feedback?.dislikedTags.length) signalNotes.push(`사용자가 아쉬운 점으로 선택: ${feedback.dislikedTags.join(", ")}`);

      await this.trainingExampleRepository.create({
        prompt: prompt.userPrompt,
        deliverableType: project.deliverableType ?? "브랜딩 & 로고",
        createdByUserId: project.userId, // 실사용자 프로젝트에서 승격된 것이라 실제 관리자 계정이 없음 -- 프로젝트 소유자로 출처를 표시(created_by_user_id는 User FK라 projectId를 넣으면 제약 위반으로 매번 insert가 실패한다).
        source: "USER_GENERATION",
        sourceGenerationVersionId: version.id,
        industry,
        evaluationScore: finalScore,
        evaluationBreakdown: {
          usageScore: { score: behavioralScore, note: signalNotes.join(" · ") },
          ...(evaluation.visionEvaluation
            ? { visionQuality: { score: evaluation.visionScore, note: evaluation.visionEvaluation.summary } }
            : {}),
        },
        evaluatedAt: new Date(),
      });
      promoted += 1;
    }

    // 용량 관리: 참고(80점 이상)/회피(60점 미만) 버킷을 각각 따로 관리 --
    // 참고 버킷은 낮은 점수부터, 회피 버킷은 threshold에 가까운(가장 덜
    // 나쁜) 것부터 삭제한다(사용자 결정: 점수가 낮을수록 회피 지침으로서
    // 가치가 크다).
    await this.trainingExampleRepository.pruneAboveThreshold(REFERENCE_PROMOTION_UPPER_THRESHOLD, ABOVE_THRESHOLD_CAPACITY);
    await this.trainingExampleRepository.pruneBelowThreshold(REFERENCE_PROMOTION_THRESHOLD, BELOW_THRESHOLD_CAPACITY);

    return { evaluated: unscored.length, promoted };
  }
}
