# 16_PRD_OneClickEdit

Project: ASTER Version: 3.0 (AI-Native Specification) Status: Draft

------------------------------------------------------------------------

# Feature ID

PRD-011

Feature Name

One Click Edit

Priority

P0 (Core Differentiator)

------------------------------------------------------------------------

# Goal

One Click Edit는 생성된 컨셉 이미지를 브랜드 전략을 유지한 채 한 번의
클릭으로 원하는 방향으로 발전시키는 기능이다.

목표는 "처음부터 다시 생성"이 아니라 "좋은 방향을 더 빠르게 다듬는
것"이다.

------------------------------------------------------------------------

# Design Principles

-   Brand Strategy는 유지한다.
-   Brand Brief를 벗어나지 않는다.
-   사용자는 프롬프트를 작성하지 않는다.
-   모든 수정은 새 버전으로 저장한다.

------------------------------------------------------------------------

# Inputs

-   Selected Generation
-   Brand Brief
-   Approved Brand Strategy
-   Selected Style
-   Edit Action

------------------------------------------------------------------------

# Supported Actions

## Style

-   더 심플하게
-   더 프리미엄하게
-   더 친근하게
-   더 미래지향적으로
-   더 클래식하게

## Color

-   컬러 변경
-   채도 낮추기
-   명도 높이기
-   단색화

## Typography

-   세리프 느낌
-   산세리프 느낌
-   굵게
-   가볍게

## Symbol

-   심볼 단순화
-   기하학적 형태
-   라인 스타일
-   입체감 감소

------------------------------------------------------------------------

# Workflow

Generation 선택 → Edit Action 선택 → Prompt Engine 수정 요청 생성 →
Safety Check → Image Generation → Version 생성 → 비교 화면 표시

------------------------------------------------------------------------

# UI Components

-   Edit Action Grid
-   Before / After Compare
-   Version Timeline
-   Favorite Button
-   Restore Button

------------------------------------------------------------------------

# Business Rules

-   원본 이미지는 변경하지 않는다.
-   수정은 항상 새 버전으로 저장한다.
-   이전 버전은 언제든 복원 가능하다.
-   수정 이력은 프로젝트에 귀속된다.

------------------------------------------------------------------------

# Cost Optimization

-   기존 생성 결과를 최대한 활용한다.
-   동일 수정 요청은 캐시 확인 후 처리한다.
-   불필요한 전체 재생성을 피한다.

------------------------------------------------------------------------

# API

POST /edit/one-click

GET /edit/history/{projectId}

POST /edit/restore

------------------------------------------------------------------------

# Database

edit_history edit_versions favorite_generations

------------------------------------------------------------------------

# Error Handling

EDIT-001 Invalid Action

EDIT-002 Generation Missing

EDIT-003 Edit Failed

------------------------------------------------------------------------

# Acceptance Criteria

-   원클릭 수정 성공
-   Before/After 비교 가능
-   버전 저장
-   복원 가능
-   브랜드 방향성 유지

------------------------------------------------------------------------

# Definition of Done

-   UI 구현
-   Edit Workflow 구현
-   Version 관리 구현
-   API 테스트
-   문서 업데이트

------------------------------------------------------------------------

# Claude Code Instructions

One Click Edit는 새로운 생성 기능이 아니라 Brand Strategy를 유지하는
'진화(Evolution)' 기능으로 구현한다.

모든 수정은 Prompt Engine을 통해 안전하게 수행하며, 사용자가 프롬프트를
직접 입력하지 않도록 설계한다.

End of Document
