# Task-036_MultiAgentOrchestrator

**Project:** ASTER\
**Task ID:** TASK-036\
**Title:** Multi-Agent Orchestrator\
**Priority:** P2\
**Estimated Effort:** 10\~12 hours

------------------------------------------------------------------------

# Objective

Aster Brain, Brand Reasoning, Style Engine, Prompt Engine, Quality
Engine 등 여러 AI 에이전트를 하나의 워크플로에서 순차 또는 병렬로
실행하고, 의존성과 실패 복구를 관리하는 Orchestrator를 구현한다.

------------------------------------------------------------------------

# Related Documents

-   13_PRD_AsterBrain.md
-   14_PRD_PromptEngine.md
-   25_AIProviderArchitecture.md
-   26_QueueAndJobArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

운영자로서 여러 AI 기능을 안정적으로 연결하고, 사용자는 하나의
버튼만으로 전체 브랜딩 프로세스를 실행하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - Agent Registry - Workflow 정의 - 병렬/순차 실행 - Retry -
Timeout - Failure Recovery - Execution Log

제외 - 외부 Workflow Engine 도입 - 사용자 정의 Workflow

------------------------------------------------------------------------

# Functional Requirements

-   Agent 등록
-   실행 순서 정의
-   의존성 관리
-   병렬 실행 지원
-   Retry 정책
-   Timeout 처리
-   실행 결과 저장

------------------------------------------------------------------------

# Workflow

Start → Brand Interview → Aster Brain → Brand Reasoning → Style Engine →
Prompt Engine → Image Generation → Quality Evaluation → Complete

------------------------------------------------------------------------

# Backend Tasks

-   OrchestratorUseCase
-   AgentRegistry
-   WorkflowExecutor
-   RetryManager
-   ExecutionLogger

------------------------------------------------------------------------

# Frontend Tasks

-   Workflow Progress
-   Agent Status Timeline
-   Execution Detail
-   Retry Action

------------------------------------------------------------------------

# API

POST /orchestrator/run

GET /orchestrator/{projectId}

GET /orchestrator/executions/{executionId}

------------------------------------------------------------------------

# Database

-   workflow_executions
-   workflow_steps
-   agent_logs
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   Workflow 실행 성공
-   Agent 상태 표시
-   Retry 동작
-   Timeout 처리
-   실행 로그 저장

------------------------------------------------------------------------

# Test Checklist

-   정상 실행
-   Agent 실패
-   Retry 성공
-   Timeout
-   병렬 실행
-   순차 실행

------------------------------------------------------------------------

# Definition of Done

-   Multi-Agent Orchestrator 구현
-   실행 로그 구현
-   Retry/Recovery 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

모든 AI 기능은 Orchestrator를 통해 실행한다. Agent 간 직접 호출을
금지하고 실행 흐름은 Workflow 정의로 관리한다. 실패한 Agent는 정책에
따라 Retry하거나 중단하며 모든 실행 기록을 저장한다.

End of Document
