import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import type { StyleRepository } from "@/modules/styles/domain/StyleRepository";
import type { StyleRecommendation } from "@/modules/styles/domain/Style";
import {
  MAX_RECOMMENDATIONS,
  buildRecommendationReason,
  buildStyleCandidatesFromAnswers,
  scoreStyle,
} from "@/modules/styles/domain/styleRules";
import { classifyInterviewInput } from "@/modules/promptPriority/domain/classifyInterviewInput";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

export class RecommendStylesUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly styleRepository: StyleRepository,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<StyleRecommendation[]> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const interview = await this.interviewRepository.findLatestByProjectId(input.projectId);
    if (!interview || interview.status !== "completed") {
      throw new ConflictError(
        "Brand Interview를 먼저 완료해야 스타일을 추천받을 수 있습니다.",
        "INTERVIEW_NOT_COMPLETED",
      );
    }

    const answers = Object.fromEntries(
      interview.answers.filter((a) => a.answer).map((a) => [a.questionKey, a.answer as string]),
    );

    const candidateCategoryNames = buildStyleCandidatesFromAnswers(answers);
    const keywordText = [answers.purpose, answers.targetAudience, answers.industry, answers.desiredImpression]
      .filter(Boolean)
      .join(" ");

    // 스타일 추천 단계에도 우선순위 원칙을 적용한다 -- 사용자가 인터뷰에서
    // 절대 포함되면 안 된다고 답한 요소와 겹치는 키워드를 가진 스타일은
    // 애초에 추천 후보에서 제외한다(색상/스타일 선택은 아직 없는 시점이라
    // 인터뷰 답변만으로 분류). AI 호출 없음.
    const { hardConstraints } = classifyInterviewInput({ answers, deliverableType: project.deliverableType });
    const forbiddenLower = hardConstraints.forbiddenElements.map((e) => e.toLowerCase());
    const isForbidden = (keywords: string[]) =>
      forbiddenLower.length > 0 &&
      keywords.some((k) => forbiddenLower.some((f) => k.toLowerCase().includes(f) || f.includes(k.toLowerCase())));

    const leafStyles = await this.styleRepository.list({ level: 3 });
    const scored = leafStyles
      .filter((style) => !isForbidden(style.keywords))
      .map((style) => ({
        style,
        score: scoreStyle(style, { candidateCategoryNames, keywordText }),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RECOMMENDATIONS);

    const recommendations: StyleRecommendation[] = [];
    for (const { style, score } of scored) {
      const alternatives = style.parentId
        ? await this.styleRepository.listSiblings(style.parentId, style.id, 3)
        : [];
      recommendations.push({
        style,
        score,
        reason: buildRecommendationReason(style, { candidateCategoryNames, keywordText }),
        alternatives,
      });
    }

    return recommendations;
  }
}
