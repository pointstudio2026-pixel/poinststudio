# Task-061_AIWorkspacePersonalization

**Project:** ASTER **Task ID:** TASK-061 **Title:** AI Workspace
Personalization **Priority:** P2 **Estimated Effort:** 9\~11 hours

------------------------------------------------------------------------

# Objective

사용자의 작업 방식, 선호도, 프로젝트 이력을 기반으로 ASTER Workspace를
개인화하여 생산성을 높인다.

------------------------------------------------------------------------

# Related Documents

-   Task-033_StyleEvolutionEngine
-   Task-040_ASTERCopilot
-   Task-050_ProductAnalytics
-   Task-052_OrganizationManagement
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 내가 자주 사용하는 기능과 작업 방식에 맞춰 화면과 추천이
자동으로 최적화되길 원한다.

------------------------------------------------------------------------

# Scope

포함 - Personalized Dashboard - Favorite Tools - Workspace Layout - AI
Recommendations - Recent Context - Preference Profiles

제외 - 자동 프로젝트 수정 - 사용자 간 프로필 공유

------------------------------------------------------------------------

# Functional Requirements

-   즐겨찾기 기능
-   최근 작업 우선 노출
-   개인 레이아웃 저장
-   AI 추천 패널
-   개인 설정 동기화
-   추천 초기화

------------------------------------------------------------------------

# Workflow

User Activity → Preference Analysis → Profile Update → Workspace
Personalization → AI Recommendation

------------------------------------------------------------------------

# Backend Tasks

-   PreferenceProfileService
-   RecommendationService
-   LayoutPreferenceManager
-   PersonalizationEngine

------------------------------------------------------------------------

# Frontend Tasks

-   Personalized Dashboard
-   Workspace Layout Editor
-   Favorite Tools Panel
-   Recommendation Sidebar

------------------------------------------------------------------------

# API

GET /personalization/profile PATCH /personalization/profile GET
/personalization/recommendations

------------------------------------------------------------------------

# Database

-   user_preferences
-   workspace_layouts
-   personalization_profiles
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   개인화 적용
-   레이아웃 저장
-   추천 제공
-   설정 동기화

------------------------------------------------------------------------

# Test Checklist

-   신규 사용자
-   기존 사용자
-   레이아웃 변경
-   추천 갱신
-   초기화

------------------------------------------------------------------------

# Definition of Done

-   Personalization 구현
-   추천 기능 구현
-   UI 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

개인화는 사용자의 작업 효율을 높이기 위한 보조 기능이다. 사용자가 언제든
개인화 기능을 비활성화하거나 초기화할 수 있도록 구현한다. 모든 개인화
데이터는 사용자별로 분리 저장한다.

End of Document
