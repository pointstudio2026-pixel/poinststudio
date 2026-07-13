# Task-013_ImageGeneration

**Project:** ASTER **Task ID:** TASK-013 **Title:** AI Image Generation
Pipeline **Priority:** P0 **Estimated Effort:** 6\~8 hours

------------------------------------------------------------------------

# Objective

Prompt Engine에서 생성한 Prompt를 AI Provider Router를 통해 전달하여
브랜드 방향성에 맞는 로고 컨셉 이미지를 생성하는 전체 파이프라인을
구현한다.

이미지 생성은 ASTER의 최종 목적이 아니라, 디자이너의 아이디어 탐색을
돕는 과정이다.

------------------------------------------------------------------------

# Related Documents

-   14_PRD_PromptEngine.md
-   15_PRD_ImageGeneration.md
-   19_PRD_Subscription.md
-   21_PRD_APIContract.md
-   25_AIProviderArchitecture.md
-   26_QueueAndJobArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 브랜드 전략과 스타일이 반영된 여러 컨셉 이미지를 빠르게
받아 아이디어를 비교하고 발전시키고 싶다.

------------------------------------------------------------------------

# Scope

포함 - 이미지 생성 요청 - Queue 등록 - Provider Router 호출 - 결과
저장 - 썸네일 생성 - 생성 이력 조회 - 원가 기록

제외 - One Click Edit - 목업 생성 - Export

------------------------------------------------------------------------

# Functional Requirements

-   비동기 Queue 기반 생성
-   Provider 자동 선택
-   플랜별 생성 개수 제한
-   생성 진행 상태 표시
-   실패 시 재시도
-   생성 결과 버전 저장

------------------------------------------------------------------------

# Workflow

Brand Knowledge → Style Selection → Prompt Engine → Queue → Provider
Router → Image Generation → Thumbnail → Database → User Notification

------------------------------------------------------------------------

# Output Schema

``` json
{
  "generationId":"uuid",
  "status":"completed",
  "images":[
    {
      "id":"uuid",
      "url":"...",
      "thumbnail":"..."
    }
  ]
}
```

------------------------------------------------------------------------

# Backend Tasks

-   CreateGenerationUseCase
-   GenerationWorker
-   ProviderRouterAdapter
-   ThumbnailService
-   UsageRecorder

------------------------------------------------------------------------

# Frontend Tasks

-   Generation Progress UI
-   Image Grid
-   Retry Button
-   Loading Skeleton
-   Empty State

------------------------------------------------------------------------

# API

POST /generations

GET /generations/{projectId}

GET /generations/status/{generationId}

POST /generations/{generationId}/retry

------------------------------------------------------------------------

# Database

-   generations
-   generation_versions
-   usage_logs
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   이미지 생성 성공
-   진행 상태 확인
-   버전 저장
-   원가 기록
-   구독 한도 적용

------------------------------------------------------------------------

# Test Checklist

-   정상 생성
-   Provider 장애
-   Queue 지연
-   생성 실패 후 재시도
-   구독 한도 초과
-   동일 프로젝트 다중 생성

------------------------------------------------------------------------

# Files Expected

Backend - modules/generations/ - workers/

Frontend - features/generation/ - components/generation/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   생성 파이프라인 구현
-   Queue 연동
-   Provider Router 연동
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

이미지 생성은 반드시 Queue를 통해 수행한다. Route Handler에서 AI
Provider를 직접 호출하지 않는다. 모든 생성 요청은 Usage를 기록하고
Generation Version을 생성한다. 결과는 재현 가능하도록 Prompt Version과
연결한다.

End of Document
