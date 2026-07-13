# Task-007_BrandInterviewUI

**Project:** ASTER **Task ID:** TASK-007 **Title:** Brand Interview UI
**Priority:** P0 **Estimated Effort:** 4\~5 hours

------------------------------------------------------------------------

# Objective

사용자가 브랜드 정보를 쉽고 빠르게 입력할 수 있는 AI 기반 Brand
Interview UI를 구현한다.

이 화면은 ASTER의 첫 번째 핵심 사용자 경험이며, 이후 Brand Brief 생성의
입력이 된다.

------------------------------------------------------------------------

# Related Documents

-   09_PRD_BrandInterview.md
-   10_PRD_BrandBrief.md
-   13_PRD_AsterBrain.md
-   23_BackendArchitecture.md
-   24_FrontendArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 복잡한 프롬프트를 작성하지 않고, AI의 질문에 답하는
것만으로 브랜드 방향성을 설계하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - 인터뷰 시작 화면 - 질문 카드 UI - 답변 입력 - 진행률 표시 -
이전/다음 이동 - 자동 저장 - 인터뷰 종료 화면

제외 - 동적 질문 생성 로직 - Brand Brief 생성

------------------------------------------------------------------------

# Functional Requirements

-   현재 질문 표시
-   답변 필수 여부 표시
-   진행률(%) 표시
-   이전 질문 수정 가능
-   자동 저장 상태 표시
-   종료 후 요약 화면 이동

------------------------------------------------------------------------

# UI Components

-   Interview Header
-   Progress Bar
-   Question Card
-   Answer Input
-   Choice Chips
-   Previous Button
-   Next Button
-   Save Indicator
-   Summary Modal

------------------------------------------------------------------------

# Backend Tasks

-   인터뷰 상태 조회 API
-   답변 저장 API
-   자동 저장 API
-   인터뷰 완료 API

------------------------------------------------------------------------

# Frontend Tasks

-   Interview Page
-   Dynamic Form Renderer
-   Progress UI
-   Autosave Hook
-   Validation
-   Keyboard Navigation

------------------------------------------------------------------------

# API

GET /interview/{projectId}

POST /interview/answer

POST /interview/complete

------------------------------------------------------------------------

# Database

-   brand_interviews
-   interview_answers
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   질문 표시
-   답변 저장
-   자동 저장 동작
-   진행률 표시
-   인터뷰 완료 처리

------------------------------------------------------------------------

# Test Checklist

-   첫 질문 진입
-   이전/다음 이동
-   자동 저장
-   필수값 누락
-   새로고침 후 복원
-   완료 후 재진입

------------------------------------------------------------------------

# Files Expected

Backend - modules/interviews/

Frontend - features/interview/ - components/interview/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   인터뷰 UI 구현
-   자동 저장 구현
-   API 연동
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Brand Interview는 폼이 아니라 대화형 경험으로 구현한다. 프론트엔드와
백엔드 모두 자동 저장을 고려하며, 비즈니스 로직은 Use Case에 구현한다.
관련 문서를 먼저 읽고 구현한다.

End of Document
