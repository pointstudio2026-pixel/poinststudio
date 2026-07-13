# Task-011_StyleEngine.md

**Project:** ASTER **Task ID:** TASK-011 **Title:** Style Engine
**Priority:** P0 **Estimated Effort:** 6\~8 hours

------------------------------------------------------------------------

# Objective

Aster Brain이 생성한 Brand Knowledge를 기반으로 브랜드에 가장 적합한
디자인 스타일을 추천하는 Style Engine을 구현한다.

Style Engine은 이미지를 생성하는 기능이 아니라 브랜드 방향성에 맞는
디자인 스타일을 설계하는 엔진이다.

------------------------------------------------------------------------

# Related Documents

-   11_PRD_BrandStrategy.md
-   12_PRD_StyleEngine.md
-   13_PRD_AsterBrain.md
-   14_PRD_PromptEngine.md
-   20_PRD_DesignMemory.md
-   22_DatabaseArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 수많은 스타일을 직접 탐색하지 않고, 브랜드에 적합한 스타일
후보를 빠르게 비교하고 선택하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - Style 매칭 - 150개 스타일 라이브러리 검색 - 대분류/중분류/소분류
구조 - 스타일 점수 계산 - 스타일 비교 - 사용자 선택 저장

제외 - 프롬프트 생성 - 이미지 생성

------------------------------------------------------------------------

# Functional Requirements

-   Brand Knowledge 기반 추천
-   최대 12개 스타일 후보 제공
-   유사 스타일 추천
-   스타일 상세 설명 제공
-   선택 이력 저장
-   즐겨찾기 지원

------------------------------------------------------------------------

# Style Taxonomy

대분류 → Modern → Classic → Luxury → Minimal → Playful → Tech → Organic
→ Editorial

중분류/소분류를 포함하여 약 150개의 스타일을 관리한다.

------------------------------------------------------------------------

# Workflow

Brand Knowledge → Style Matching → Score Calculation → Candidate Ranking
→ User Selection → Prompt Engine

------------------------------------------------------------------------

# Output Schema

``` json
{
  "recommendedStyles": [],
  "score": [],
  "reason": [],
  "alternatives": []
}
```

------------------------------------------------------------------------

# Backend Tasks

-   StyleMatchingUseCase
-   StyleRepository
-   ScoreCalculator
-   RecommendationEngine
-   SelectionHistoryService

------------------------------------------------------------------------

# Frontend Tasks

-   Style Gallery
-   Filter Panel
-   Style Detail Drawer
-   Compare View
-   Favorite Button

------------------------------------------------------------------------

# API

GET /styles

POST /styles/recommend

POST /styles/select

GET /styles/history

------------------------------------------------------------------------

# Database

-   styles
-   style_relations
-   style_selections
-   design_memory

------------------------------------------------------------------------

# Acceptance Criteria

-   스타일 추천 성공
-   점수 계산
-   스타일 비교 가능
-   선택 이력 저장
-   Design Memory 반영

------------------------------------------------------------------------

# Test Checklist

-   업종별 추천
-   스타일 필터
-   즐겨찾기
-   추천 결과 없음
-   동일 프로젝트 재선택
-   권한 검증

------------------------------------------------------------------------

# Files Expected

Backend - modules/styles/

Frontend - features/styles/ - components/styles/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   Style Engine 구현
-   추천 알고리즘 구현
-   UI 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Style Engine은 이미지 생성기가 아니라 브랜드 스타일 추천 엔진이다. 추천
근거를 항상 함께 제공하며, 선택 결과는 Design Memory에 반영한다. Prompt
Engine은 사용자가 스타일을 확정한 이후에만 실행한다.

End of Document
