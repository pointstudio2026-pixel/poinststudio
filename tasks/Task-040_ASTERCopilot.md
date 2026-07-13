# Task-040_ASTERCopilot

**Project:** ASTER **Task ID:** TASK-040 **Title:** ASTER Copilot
**Priority:** P2 **Estimated Effort:** 10\~12 hours

------------------------------------------------------------------------

# Objective

디자이너의 작업 전 과정에서 브랜드 전략, 로고, 스타일, 컬러,
타이포그래피에 대한 실시간 제안과 피드백을 제공하는 AI Copilot을
구현한다.

Copilot은 작업을 대신하는 것이 아니라 디자이너의 의사결정을 지원하는
파트너 역할을 수행한다.

------------------------------------------------------------------------

# Related Documents

-   10_PRD_BrandBrief.md
-   11_PRD_BrandStrategy.md
-   13_PRD_AsterBrain.md
-   20_PRD_DesignMemory.md
-   25_AIProviderArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 작업 중 언제든 AI에게 브랜드와 디자인에 대한 조언을 받고,
빠르게 더 나은 방향으로 수정하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - AI 채팅 - 브랜드 컨텍스트 기반 답변 - 디자인 피드백 - 수정 제안 -
작업 히스토리 참조 - 추천 액션

제외 - 사용자 대신 자동 수정 - 외부 메신저 연동

------------------------------------------------------------------------

# Functional Requirements

-   프로젝트 컨텍스트 인식
-   Brand Brief 기반 답변
-   디자인 개선 제안
-   스타일 추천
-   One Click Action 추천
-   대화 기록 저장

------------------------------------------------------------------------

# Workflow

Open Copilot → Load Project Context → User Question → Context Retrieval
→ Aster Brain → AI Response → Suggested Actions

------------------------------------------------------------------------

# Backend Tasks

-   CopilotUseCase
-   ContextRetriever
-   ConversationService
-   SuggestionEngine
-   ConversationHistory

------------------------------------------------------------------------

# Frontend Tasks

-   Copilot Sidebar
-   Chat Interface
-   Suggested Actions
-   Context Panel
-   Conversation History

------------------------------------------------------------------------

# API

POST /copilot/chat

GET /copilot/history/{projectId}

GET /copilot/context/{projectId}

POST /copilot/actions

------------------------------------------------------------------------

# Database

-   copilot_conversations
-   copilot_messages
-   suggested_actions
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   프로젝트 기반 답변
-   대화 기록 저장
-   추천 액션 표시
-   컨텍스트 반영
-   응답 생성 성공

------------------------------------------------------------------------

# Test Checklist

-   신규 프로젝트
-   기존 프로젝트
-   긴 대화
-   컨텍스트 변경
-   추천 액션 실행
-   권한 검증

------------------------------------------------------------------------

# Definition of Done

-   Copilot 구현
-   Context Retrieval 구현
-   Chat UI 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Copilot은 항상 현재 프로젝트의 Brand Brief와 Brand Knowledge를 우선
참조한다. 답변은 설명과 근거를 포함하며, 가능한 경우 One Click
Action으로 이어질 수 있는 추천을 함께 제공한다. 사용자의 승인 없이
프로젝트 데이터를 자동 변경하지 않는다.

End of Document
