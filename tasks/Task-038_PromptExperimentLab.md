# Task-038_PromptExperimentLab

**Project:** ASTER **Task ID:** TASK-038 **Title:** Prompt Experiment
Lab **Priority:** P2 **Estimated Effort:** 8\~10 hours

------------------------------------------------------------------------

# Objective

Prompt Engine의 품질을 지속적으로 개선하기 위해 다양한 프롬프트 템플릿을
실험하고, 결과를 비교·평가하는 Prompt Experiment Lab을 구현한다.

------------------------------------------------------------------------

# Related Documents

-   14_PRD_PromptEngine.md
-   15_PRD_ImageGeneration.md
-   25_AIProviderArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

운영자로서 여러 프롬프트 버전을 비교하여 가장 좋은 결과를 내는 템플릿을
운영 환경에 적용하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - Prompt A/B 테스트 - 템플릿 버전 관리 - 실험 결과 비교 - 성능
지표 - 운영 반영(Publish)

제외 - 사용자 임의 프롬프트 공유 - 자동 운영 반영

------------------------------------------------------------------------

# Functional Requirements

-   Prompt Variant 생성
-   A/B 테스트 실행
-   결과 비교
-   품질 점수 기록
-   비용 및 응답시간 비교
-   우수 템플릿 Publish

------------------------------------------------------------------------

# Workflow

Create Variant → Execute Test → Collect Results → Compare Metrics →
Select Winner → Publish

------------------------------------------------------------------------

# Backend Tasks

-   PromptExperimentUseCase
-   VariantManager
-   ExperimentRunner
-   MetricsCollector
-   PublishService

------------------------------------------------------------------------

# Frontend Tasks

-   Experiment Dashboard
-   Variant Editor
-   Comparison Table
-   Metrics Charts
-   Publish Dialog

------------------------------------------------------------------------

# API

POST /prompt-lab/experiments

GET /prompt-lab/experiments

GET /prompt-lab/results/{experimentId}

POST /prompt-lab/publish

------------------------------------------------------------------------

# Database

-   prompt_experiments
-   prompt_variants
-   experiment_results
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   실험 생성
-   Variant 비교
-   성능 지표 표시
-   Publish 성공
-   이력 저장

------------------------------------------------------------------------

# Test Checklist

-   Variant 생성
-   A/B 비교
-   비용 비교
-   응답시간 비교
-   Publish
-   권한 검증

------------------------------------------------------------------------

# Definition of Done

-   Prompt Experiment Lab 구현
-   비교 UI 구현
-   Publish 기능 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Prompt 실험은 운영 Prompt와 분리하여 수행한다. 모든 실험은 버전과 결과를
저장하고 운영 반영은 명시적인 Publish 이후에만 적용한다. 품질, 비용,
속도를 함께 비교할 수 있도록 메트릭을 수집한다.

End of Document
