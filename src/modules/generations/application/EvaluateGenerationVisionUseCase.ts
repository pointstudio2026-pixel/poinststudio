import type { GenerationEvaluationRepository } from "@/modules/generations/domain/GenerationEvaluationRepository";
import type { PromptDecisionRecordRepository } from "@/modules/promptPriority/domain/PromptDecisionRecordRepository";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import type { TextCompletionProvider } from "@/shared/ai/TextCompletionProvider";
import {
  buildVisionEvaluationPrompt,
  parseVisionEvaluationResponse,
  computeVisionScore,
  summarizeBrandContext,
  summarizeHardConstraints,
} from "@/modules/generations/domain/visionEvaluation";
import { logger } from "@/shared/logging/logger";

export interface EvaluateGenerationVisionInput {
  generationEvaluationId: string;
  projectId: string;
  promptVersionId: string;
  imageUrl: string;
  imagePromptText: string;
}

/**
 * 생성 완료 직후(ProcessGenerationJobUseCase) 한 번 호출되는 best-effort
 * 보강 단계 -- 이미지 + 프롬프트 + 브랜드 인터뷰를 비교해 실제로 잘
 * 수행됐는지, 요즘 디자인 트렌드에 맞는지, 기술적 완성도(텍스트 깨짐/형태
 * 뭉개짐/여러 시안 혼합 등)까지 GPT Vision으로 판단한다(2026-07-24 사용자
 * 승인, 기술적 완성도는 제안 후 승인받은 기준). 실패해도(네트워크 오류,
 * JSON 파싱 실패 등) 절대 생성 자체를 실패시키지 않는다 -- 여기서 에러를
 * 삼키고 로그만 남긴다.
 */
export class EvaluateGenerationVisionUseCase {
  constructor(
    private readonly generationEvaluationRepository: GenerationEvaluationRepository,
    private readonly promptDecisionRecordRepository: PromptDecisionRecordRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly visionProvider: TextCompletionProvider,
  ) {}

  async execute(input: EvaluateGenerationVisionInput): Promise<void> {
    try {
      const decisionRecord = await this.promptDecisionRecordRepository.findByPromptVersionId(input.promptVersionId);
      const interview = await this.interviewRepository.findLatestByProjectId(input.projectId);

      const { systemPrompt, userPrompt } = buildVisionEvaluationPrompt({
        imagePromptText: input.imagePromptText,
        brandContext: summarizeBrandContext(interview?.answers ?? []),
        constraintContext: summarizeHardConstraints(decisionRecord?.hardConstraints ?? null),
      });

      const result = await this.visionProvider.complete({
        systemPrompt,
        userPrompt,
        imageDataUris: [input.imageUrl],
        maxTokens: 600,
        temperature: 0.2,
      });

      const evaluation = parseVisionEvaluationResponse(result.text);
      const score = computeVisionScore(evaluation);

      await this.generationEvaluationRepository.updateVisionEvaluation(input.generationEvaluationId, score, evaluation);
    } catch (err) {
      logger.error("Vision evaluation failed (non-blocking)", {
        generationEvaluationId: input.generationEvaluationId,
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
