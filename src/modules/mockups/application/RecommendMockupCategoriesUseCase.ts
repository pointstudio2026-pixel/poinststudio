import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import { MOCKUP_CATEGORIES } from "@/modules/mockups/domain/Mockup";
import { rankMockupCategories, type MockupCategoryRecommendation } from "@/modules/mockups/domain/mockupRules";
import { NotFoundError } from "@/shared/errors/AppError";

/**
 * RecommendStylesUseCase와 달리 인터뷰 미완료를 에러로 막지 않는다 -- 목업
 * 스튜디오는 항상 인터뷰 이후 단계에서만 진입 가능하지만, 이 랭킹은 "있으면
 * 더 똑똑해지는" 보조 기능이라 답변이 없어도 그냥 기본 순서(전부 점수 0)를
 * 돌려줘 화면이 깨지지 않게 한다.
 */
export class RecommendMockupCategoriesUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly interviewRepository: InterviewRepository,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<MockupCategoryRecommendation[]> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const interview = await this.interviewRepository.findLatestByProjectId(input.projectId);
    const answers = Object.fromEntries(
      (interview?.answers ?? []).filter((a) => a.answer).map((a) => [a.questionKey, a.answer as string]),
    );

    const keywordText = [answers.industry, answers.purpose, answers.targetAudience, project.deliverableType]
      .filter(Boolean)
      .join(" ");

    return rankMockupCategories([...MOCKUP_CATEGORIES], { keywordText });
  }
}
