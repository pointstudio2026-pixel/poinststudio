# Task-018_DesignMemory

**Project:** ASTER **Task ID:** TASK-018 **Title:** Design Memory
**Priority:** P1 **Estimated Effort:** 5\~7 hours

------------------------------------------------------------------------

# Objective

사용자의 프로젝트 이력, 스타일 선택, 원클릭 수정 패턴을 학습하여
개인화된 디자인 추천을 제공하는 Design Memory 기능을 구현한다.

Design Memory는 자동으로 디자인를 변경하지 않으며, 추천만 제공하고 최종
결정은 항상 사용자가 내린다.

------------------------------------------------------------------------

# Related Documents

-   12_PRD_StyleEngine.md
-   16_PRD_OneClickEdit.md
-   20_PRD_DesignMemory.md
-   22_DatabaseArchitecture.md
-   23_BackendArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 자주 사용하는 스타일과 수정 방향을 기억하여 다음
프로젝트에서 더 빠르게 시작하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - 사용자 선호 저장 - 스타일 추천 개선 - 수정 패턴 분석 - 즐겨찾기
반영 - 개인화 추천 - 메모리 초기화

제외 - 자동 디자인 수정 - 사용자 동의 없는 학습 - 다른 사용자 데이터
활용

------------------------------------------------------------------------

# Functional Requirements

-   프로젝트 완료 시 선호도 갱신
-   스타일 선택 빈도 기록
-   One Click Edit 패턴 기록
-   즐겨찾기 반영
-   추천 근거 제공
-   메모리 비활성화 지원

------------------------------------------------------------------------

# Workflow

Project Complete → Collect Signals → Update Design Memory →
Recommendation Engine → Next Project Suggestions

------------------------------------------------------------------------

# Memory Signals

-   선택한 스타일
-   수정 프리셋
-   선호 색상
-   선호 타이포
-   즐겨찾기
-   프로젝트 업종

------------------------------------------------------------------------

# Backend Tasks

-   UpdateDesignMemoryUseCase
-   PreferenceAnalyzer
-   RecommendationService
-   ResetMemoryUseCase

------------------------------------------------------------------------

# Frontend Tasks

-   Design Memory Settings
-   Recommendation Panel
-   Reset Button
-   Enable/Disable Toggle

------------------------------------------------------------------------

# API

GET /design-memory

POST /design-memory/update

POST /design-memory/reset

PATCH /design-memory/settings

------------------------------------------------------------------------

# Database

-   design_memory
-   style_selections
-   edit_history
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   선호도 저장
-   추천 품질 향상
-   초기화 가능
-   비활성화 가능
-   추천 근거 표시

------------------------------------------------------------------------

# Test Checklist

-   신규 사용자
-   프로젝트 완료 후 업데이트
-   메모리 초기화
-   비활성화
-   권한 검증
-   추천 결과 확인

------------------------------------------------------------------------

# Files Expected

Backend - modules/design-memory/

Frontend - features/design-memory/ - components/design-memory/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   Design Memory 구현
-   추천 엔진 연동
-   설정 화면 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Design Memory는 개인화 추천 시스템이다. 자동으로 결과를 변경하지 말고
추천만 제공한다. 사용자 데이터는 사용자 본인에게만 적용하며, 언제든
초기화 및 비활성화할 수 있도록 구현한다.

End of Document
