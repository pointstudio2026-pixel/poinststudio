# 07_PRD_Dashboard

Project: ASTER Version: 2.0 (AI-Native Specification) Status: Draft

------------------------------------------------------------------------

# Feature ID

PRD-002

Feature Name

Dashboard

Priority

P0

------------------------------------------------------------------------

# Goal

로그인 후 사용자가 프로젝트 현황을 한눈에 확인하고 새로운 프로젝트를
빠르게 시작할 수 있도록 한다.

------------------------------------------------------------------------

# User Stories

US-001 사용자는 최근 프로젝트를 볼 수 있다.

US-002 사용자는 새 프로젝트를 생성할 수 있다.

US-003 사용자는 즐겨찾기 프로젝트에 빠르게 접근할 수 있다.

US-004 사용자는 구독 상태와 남은 생성량을 확인할 수 있다.

------------------------------------------------------------------------

# Screen Layout

Header ├─ Logo ├─ Search ├─ Notifications └─ User Menu

Sidebar ├─ Dashboard ├─ Projects ├─ Style Library ├─ Concept Boards ├─
Subscription └─ Settings

Main ├─ Welcome Card ├─ New Project Button ├─ Recent Projects ├─
Favorites ├─ Usage Summary └─ Recommended Actions

------------------------------------------------------------------------

# Components

-   Project Card
-   New Project Button
-   Search Bar
-   Usage Widget
-   Empty State
-   Quick Action Card

------------------------------------------------------------------------

# State

Loading → Ready

Ready → Open Project → Create Project

Error → Retry

------------------------------------------------------------------------

# Business Rules

-   최근 프로젝트는 최대 10개 표시
-   즐겨찾기는 사용자 지정
-   구독 플랜에 따라 생성량 표시
-   프로젝트는 수정일 기준 정렬

------------------------------------------------------------------------

# API

GET /dashboard

GET /projects/recent

GET /projects/favorites

GET /subscription/usage

POST /projects

------------------------------------------------------------------------

# Database

users

projects

favorites

subscriptions

------------------------------------------------------------------------

# AI Sequence

Dashboard 진입 → 사용자 정보 조회 → 프로젝트 목록 조회 → 생성량 조회 →
추천 액션 표시

------------------------------------------------------------------------

# Error Handling

DASH-001 프로젝트 조회 실패

DASH-002 서버 오류

DASH-003 생성량 조회 실패

------------------------------------------------------------------------

# Acceptance Criteria

-   2초 이내 Dashboard 표시
-   새 프로젝트 버튼 정상 동작
-   최근 프로젝트 목록 표시
-   생성량 정확히 표시

------------------------------------------------------------------------

# Definition of Done

-   Frontend 완료
-   Backend 완료
-   API 연동 완료
-   테스트 완료
-   접근성 점검 완료

------------------------------------------------------------------------

# Claude Code Instructions

-   기존 문서(00\~06)를 먼저 읽는다.
-   Dashboard는 재사용 가능한 컴포넌트 기반으로 구현한다.
-   상태 관리는 중앙(Store)에서 처리한다.
-   모바일 대응을 고려한 반응형 구조로 작성한다.

End of Document
