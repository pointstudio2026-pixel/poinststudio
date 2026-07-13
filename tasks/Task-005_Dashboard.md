# Task-005_Dashboard.md

**Project:** ASTER **Task ID:** TASK-005 **Title:** Dashboard
**Priority:** P0 **Estimated Effort:** 3\~4 hours

------------------------------------------------------------------------

# Objective

로그인 후 사용자가 자신의 프로젝트와 사용 현황을 한눈에 확인하고, 새
프로젝트를 빠르게 시작할 수 있는 Dashboard를 구현한다.

------------------------------------------------------------------------

# Related Documents

-   07_PRD_Dashboard.md
-   08_PRD_ProjectWorkspace.md
-   19_PRD_Subscription.md
-   20_PRD_DesignMemory.md
-   21_PRD_APIContract.md
-   23_BackendArchitecture.md
-   24_FrontendArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 최근 작업 프로젝트와 사용량을 빠르게 확인하고 한 번의
클릭으로 새 프로젝트를 시작하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - Dashboard 레이아웃 - 최근 프로젝트 목록 - 프로젝트 검색 - 새
프로젝트 버튼 - 사용량 위젯 - 구독 플랜 요약 - 최근 활동

제외 - 프로젝트 편집 - Brand Interview - 관리자 대시보드

------------------------------------------------------------------------

# Functional Requirements

-   최근 수정순 프로젝트 표시
-   프로젝트 상태(draft, progress, completed) 표시
-   프로젝트 검색
-   프로젝트 즐겨찾기 표시
-   현재 플랜 및 사용량 표시
-   새 프로젝트 생성 화면으로 이동

------------------------------------------------------------------------

# UI Components

-   Top Navigation
-   Welcome Header
-   New Project Button
-   Project Cards
-   Recent Activity
-   Usage Widget
-   Subscription Card
-   Search Bar

------------------------------------------------------------------------

# Backend Tasks

-   DashboardUseCase
-   GET /dashboard API
-   프로젝트 요약 조회
-   사용량 집계
-   최근 활동 조회

------------------------------------------------------------------------

# Frontend Tasks

-   Dashboard Page
-   Project Card Component
-   Usage Widget
-   Search Component
-   Loading Skeleton
-   Error State

------------------------------------------------------------------------

# API

GET /dashboard

Response

``` json
{
  "success": true,
  "data": {
    "projects": [],
    "usage": {},
    "subscription": {},
    "recentActivity": []
  }
}
```

------------------------------------------------------------------------

# Database

-   projects
-   subscriptions
-   usage_logs
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   Dashboard 정상 표시
-   프로젝트 검색 동작
-   사용량 표시
-   새 프로젝트 이동
-   최근 활동 표시

------------------------------------------------------------------------

# Test Checklist

-   프로젝트 없음
-   프로젝트 다수
-   검색 결과 없음
-   사용량 한도 근접
-   API 오류 처리

------------------------------------------------------------------------

# Files Expected

Backend - modules/dashboard/ - app/api/dashboard/

Frontend - features/dashboard/ - components/dashboard/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   Dashboard 구현
-   API 연동
-   Skeleton UI 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Dashboard는 빠른 로딩을 목표로 한다. 프로젝트 목록은 최근 수정순으로
조회한다. 비즈니스 로직은 Use Case에 구현하고, API는 요약 데이터를
반환한다. 공통 컴포넌트를 적극 재사용하며 Unit, Integration, E2E
테스트를 함께 작성한다.

End of Document
