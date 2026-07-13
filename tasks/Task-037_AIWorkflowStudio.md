# Task-037_AIWorkflowStudio

**Project:** ASTER **Task ID:** TASK-037 **Title:** AI Workflow Studio
**Priority:** P2 **Estimated Effort:** 10\~12 hours

------------------------------------------------------------------------

# Objective

운영자가 AI 워크플로를 시각적으로 구성, 수정, 테스트할 수 있는 Workflow
Studio를 구현한다.

코드 수정 없이 Agent 순서와 실행 조건을 관리할 수 있도록 한다.

------------------------------------------------------------------------

# Related Documents

-   25_AIProviderArchitecture.md
-   26_QueueAndJobArchitecture.md
-   27_DeploymentArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

운영자로서 새로운 AI 워크플로를 시각적으로 설계하고 테스트하여 빠르게
운영에 반영하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - Workflow Canvas - Node Editor - Connection Editor - Condition
설정 - Test Run - Workflow Version

제외 - 사용자 Workflow 생성 - 외부 Workflow Import

------------------------------------------------------------------------

# Functional Requirements

-   Drag & Drop 노드
-   Agent 연결
-   조건 분기
-   병렬 실행 설정
-   테스트 실행
-   버전 저장 및 복원

------------------------------------------------------------------------

# Workflow

Create Workflow → Configure Nodes → Validate → Test Run → Publish →
Execute

------------------------------------------------------------------------

# Backend Tasks

-   WorkflowDefinitionService
-   WorkflowValidator
-   WorkflowVersionManager
-   TestRunner
-   PublishService

------------------------------------------------------------------------

# Frontend Tasks

-   Workflow Canvas
-   Node Palette
-   Property Panel
-   Execution Simulator
-   Version History

------------------------------------------------------------------------

# API

GET /workflow-studio POST /workflow-studio POST /workflow-studio/test
POST /workflow-studio/publish GET /workflow-studio/versions

------------------------------------------------------------------------

# Database

-   workflow_definitions
-   workflow_versions
-   workflow_nodes
-   workflow_edges
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   Workflow 생성
-   Validation 통과
-   Test Run 성공
-   Publish 성공
-   Version 관리

------------------------------------------------------------------------

# Test Checklist

-   노드 추가
-   연결 변경
-   조건 분기
-   병렬 실행
-   Validation 오류
-   버전 복원

------------------------------------------------------------------------

# Definition of Done

-   Workflow Studio 구현
-   시뮬레이터 구현
-   버전 관리 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Workflow Studio는 운영자 전용 기능이다. 워크플로는 선언형 정의(JSON
기반)로 저장하고 Orchestrator가 이를 실행한다. 모든 변경은 버전 관리하며
Publish 전 Validation을 반드시 수행한다.

End of Document
