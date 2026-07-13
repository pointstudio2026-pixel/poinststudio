# Task-031_AIQualityEvaluation

**Project:** ASTER **Task ID:** TASK-031 **Title:** AI Quality
Evaluation Engine **Priority:** P2 **Estimated Effort:** 8\~10 hours

------------------------------------------------------------------------

# Objective

AI가 생성한 브랜드 전략, 스타일 추천, 이미지 결과를 자동으로 평가하여
낮은 품질의 결과를 감지하고 재생성을 유도하는 품질 평가 엔진을 구현한다.

------------------------------------------------------------------------

# Related Documents

-   11_PRD_BrandStrategy.md
-   12_PRD_StyleEngine.md
-   13_PRD_AsterBrain.md
-   15_PRD_ImageGeneration.md
-   25_AIProviderArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 품질이 낮은 결과를 걸러내고 더 일관된 브랜드 방향성을 받고
싶다.

------------------------------------------------------------------------

# Scope

포함 - 품질 점수 계산 - 브랜드 일관성 검사 - 스타일 적합성 평가 - 재생성
권장 - 평가 로그 저장

제외 - 사용자 평점 시스템 - 자동 디자인 수정

------------------------------------------------------------------------

# Functional Requirements

-   Brand Brief 일치도 평가
-   Style 적합도 평가
-   Prompt 품질 검사
-   이미지 결과 품질 점수
-   최소 품질 기준 설정
-   재생성 추천

------------------------------------------------------------------------

# Workflow

Generation Result → Quality Evaluator → Score Calculation → Threshold
Check → Accept or Recommend Retry → Store Evaluation

------------------------------------------------------------------------

# Backend Tasks

-   QualityEvaluationUseCase
-   BrandConsistencyEvaluator
-   StyleEvaluator
-   ImageQualityScorer
-   EvaluationHistoryService

------------------------------------------------------------------------

# Frontend Tasks

-   Quality Score Badge
-   Evaluation Detail Panel
-   Retry Recommendation Banner
-   Quality History

------------------------------------------------------------------------

# API

POST /quality/evaluate

GET /quality/{projectId}

GET /quality/history

------------------------------------------------------------------------

# Database

-   quality_evaluations
-   generation_versions
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   품질 점수 계산
-   기준 미달 감지
-   재생성 권장
-   평가 이력 저장

------------------------------------------------------------------------

# Test Checklist

-   높은 품질 결과
-   낮은 품질 결과
-   Brand Brief 불일치
-   스타일 불일치
-   재평가 수행

------------------------------------------------------------------------

# Definition of Done

-   품질 평가 엔진 구현
-   평가 UI 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

품질 평가는 사용자의 디자인을 대체하지 않는다. 평가 결과는 참고 정보이며
최종 결정은 항상 사용자에게 맡긴다. 평가 기준은 모듈화하여 향후 쉽게
확장할 수 있도록 구현한다.

End of Document
