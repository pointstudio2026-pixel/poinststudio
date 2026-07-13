# 24_FrontendArchitecture

**Project:** ASTER **Document:** Frontend Architecture **Version:** 4.0
**Status:** Draft

------------------------------------------------------------------------

# Purpose

본 문서는 ASTER 프론트엔드의 구조, UI 원칙, 상태관리, 컴포넌트 설계,
접근성, 성능 최적화 기준을 정의한다.

------------------------------------------------------------------------

# Technology Stack

-   Next.js (App Router)
-   React
-   TypeScript (Strict)
-   Tailwind CSS
-   shadcn/ui
-   React Hook Form
-   Zod
-   TanStack Query
-   Zustand (UI 상태)

------------------------------------------------------------------------

# Architecture

``` text
App
 ├── Routes
 ├── Layouts
 ├── Features
 ├── Shared Components
 ├── Hooks
 ├── Services(API)
 ├── Stores
 └── Utils
```

------------------------------------------------------------------------

# Feature Modules

-   Authentication
-   Dashboard
-   Project Workspace
-   Brand Interview
-   Brand Brief
-   Brand Strategy
-   Style Engine
-   Image Generation
-   One Click Edit
-   Concept Board
-   Mockup Studio
-   Subscription
-   Settings
-   Admin

------------------------------------------------------------------------

# Folder Structure

``` text
src/
├── app/
├── features/
├── components/
├── services/
├── hooks/
├── stores/
├── lib/
├── styles/
└── types/
```

------------------------------------------------------------------------

# State Management

Global - 인증 상태 - 사용자 정보 - 현재 프로젝트 - UI 테마

Server State - API 데이터 - 프로젝트 목록 - 생성 결과 - 구독 정보

Local State - 입력 폼 - 모달 - 토글 - 임시 편집 상태

------------------------------------------------------------------------

# Design System Rules

-   8px Spacing Grid
-   반응형 우선
-   재사용 가능한 컴포넌트
-   다크모드 지원 구조
-   디자인 토큰 기반

------------------------------------------------------------------------

# Accessibility

-   WCAG 2.2 AA 목표
-   키보드 탐색 지원
-   ARIA 속성 적용
-   색상 대비 기준 준수

------------------------------------------------------------------------

# Performance

-   코드 분할
-   이미지 Lazy Loading
-   Route Prefetch
-   Suspense 사용
-   Skeleton UI 제공

------------------------------------------------------------------------

# Error Handling

-   Error Boundary
-   API 오류 토스트
-   재시도 버튼
-   오프라인 안내

------------------------------------------------------------------------

# API Layer

모든 API 호출은 services 계층을 통해 수행한다. 컴포넌트에서 fetch를 직접
호출하지 않는다.

------------------------------------------------------------------------

# Component Rules

-   Presentational / Container 분리
-   Props 최소화
-   재사용 우선
-   비즈니스 로직은 Feature Layer에 위치

------------------------------------------------------------------------

# Testing

-   Component Test
-   Hook Test
-   E2E Test
-   접근성 테스트

------------------------------------------------------------------------

# Acceptance Criteria

-   반응형 지원
-   접근성 기준 충족
-   API 계층 분리
-   디자인 시스템 적용
-   성능 목표 충족

------------------------------------------------------------------------

# Definition of Done

-   Layout 구현
-   Design System 구축
-   공통 컴포넌트 작성
-   API Layer 작성
-   테스트 환경 구축

------------------------------------------------------------------------

# Claude Code Instructions

1.  모든 화면은 공통 Design System을 사용한다.
2.  API 호출은 services 계층으로 제한한다.
3.  비즈니스 로직을 UI 컴포넌트에 작성하지 않는다.
4.  모든 신규 컴포넌트는 재사용 가능하도록 설계한다.

End of Document
