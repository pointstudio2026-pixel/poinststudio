# Task-008_DynamicInterviewEngine

**Project:** ASTER **Task ID:** TASK-008 **Title:** Dynamic Interview
Engine **Priority:** P0 **Estimated Effort:** 5\~6 hours

------------------------------------------------------------------------

# Objective

Brand Interview를 정적인 설문이 아닌 AI 기반의 동적 인터뷰 엔진으로
구현한다.

사용자의 이전 답변과 업종에 따라 질문이 변경되며, 필요한 정보가 부족한
경우 AI가 추가 질문을 생성한다.

------------------------------------------------------------------------

# Related Documents

-   09_PRD_BrandInterview.md
-   10_PRD_BrandBrief.md
-   11_PRD_BrandStrategy.md
-   13_PRD_AsterBrain.md
-   14_PRD_PromptEngine.md
-   22_DatabaseArchitecture.md
-   23_BackendArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 모든 브랜드에 같은 질문을 받는 것이 아니라, 브랜드 상황에
맞는 질문을 받아 빠르게 방향성을 정리하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - 업종별 질문 세트 - 질문 분기(Conditional Branch) - AI 추가 질문 -
질문 우선순위 - 인터뷰 종료 판단 - 질문 버전 관리

제외 - Brand Brief 생성 - Style 추천 - 이미지 생성

------------------------------------------------------------------------

# Functional Requirements

-   업종에 따라 기본 질문 변경
-   이전 답변에 따라 다음 질문 변경
-   답변이 부족하면 추가 질문 생성
-   최대 추가 질문 수 제한
-   질문 순서 저장
-   인터뷰 재개 시 동일 상태 복원

------------------------------------------------------------------------

# Decision Rules

기본 흐름

Brand Type → Base Questions → Answer Analysis → Missing Information
Detection → Follow-up Questions → Completion Check

------------------------------------------------------------------------

# AI Rules

-   질문은 간결하게 작성
-   같은 질문 반복 금지
-   이미 확보한 정보는 다시 묻지 않음
-   신뢰도가 낮으면 보충 질문 생성
-   최대 추가 질문: 3개

------------------------------------------------------------------------

# Backend Tasks

-   DynamicInterviewUseCase
-   QuestionSelector
-   FollowUpQuestionService
-   CompletionEvaluator
-   InterviewStateManager

------------------------------------------------------------------------

# Frontend Tasks

-   Dynamic Question Renderer
-   Follow-up Indicator
-   Question Transition Animation
-   Interview Resume

------------------------------------------------------------------------

# API

GET /interview/questions

POST /interview/next

POST /interview/follow-up

POST /interview/finish-check

------------------------------------------------------------------------

# Database

-   brand_interviews
-   interview_answers
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   업종별 질문 변경
-   추가 질문 생성
-   인터뷰 상태 복원
-   종료 조건 정상 판단
-   질문 중복 없음

------------------------------------------------------------------------

# Test Checklist

-   카페 업종
-   병원 업종
-   IT 스타트업
-   답변 부족
-   답변 충분
-   새로고침 후 재개
-   최대 질문 수 초과 방지

------------------------------------------------------------------------

# Files Expected

Backend - modules/interviews/application/ - modules/interviews/domain/ -
modules/interviews/infrastructure/

Frontend - features/interview/ - hooks/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   Dynamic Engine 구현
-   업종별 분기 구현
-   AI Follow-up 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Dynamic Interview Engine은 규칙 기반과 AI 기반을 함께 사용한다. 기본
질문은 규칙으로 선택하고, 추가 질문만 AI를 사용한다. 질문 생성 결과는
항상 저장하여 인터뷰를 재개할 수 있도록 구현한다. 관련 설계 문서를 먼저
읽고 구현한다.

End of Document
