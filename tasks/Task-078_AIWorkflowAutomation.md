# Task-078_AIWorkflowAutomation

**Project:** ASTER **Task ID:** TASK-078 **Title:** AI Workflow
Automation **Priority:** P1 **Estimated Effort:** 10\~12 hours

------------------------------------------------------------------------

# Objective

사용자가 반복적인 브랜딩 및 디자인 업무를 자동화할 수 있도록 AI 기반
Workflow Builder와 자동 실행 엔진을 구축한다.

------------------------------------------------------------------------

# Related Documents

-   Task-037_AIWorkflowStudio
-   Task-040_ASTERCopilot
-   Task-072_AutonomousBrandAgent
-   Task-074_AIDesignAutomationPipeline
-   Task-077_PluginSDK
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

사용자로서 반복되는 작업을 한 번만 설정하고 자동으로 실행되도록 만들고
싶다.

------------------------------------------------------------------------

# Scope

포함 - Workflow Builder - Trigger - Conditions - AI Actions -
Scheduling - Execution History

제외 - 운영체제 자동화 - 사용자 승인 없는 외부 서비스 실행

------------------------------------------------------------------------

# Functional Requirements

-   Drag & Drop Builder
-   Trigger 설정
-   조건 분기
-   AI Action 노드
-   예약 실행
-   실행 로그

------------------------------------------------------------------------

# Workflow

Create Workflow → Configure Trigger → Add AI Actions → Validate →
Schedule → Execute → Review Results

------------------------------------------------------------------------

# Backend Tasks

-   WorkflowEngine
-   TriggerManager
-   ActionExecutor
-   Scheduler
-   ExecutionLogger

------------------------------------------------------------------------

# Frontend Tasks

-   Workflow Builder
-   Node Editor
-   Execution Timeline
-   Automation Dashboard
-   Log Viewer

------------------------------------------------------------------------

# API

POST /automation/workflows GET /automation/workflows POST
/automation/workflows/{workflowId}/run GET /automation/executions

------------------------------------------------------------------------

# Database

-   workflows
-   workflow_nodes
-   workflow_runs
-   execution_logs
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   워크플로 생성
-   자동 실행
-   실행 기록
-   예약 실행
-   로그 조회

------------------------------------------------------------------------

# Test Checklist

-   Trigger 실행
-   조건 분기
-   AI Action
-   예약 실행
-   실패 재시도
-   권한 검증

------------------------------------------------------------------------

# Definition of Done

-   Workflow Builder 구현
-   실행 엔진 구현
-   Scheduler 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

워크플로는 시각적으로 편집 가능해야 하며 모든 실행은 추적 가능해야 한다.
자동 실행은 사용자 권한과 승인 정책을 준수한다. 실패한 단계는 안전하게
재시도하고 상세 로그를 남긴다.

End of Document
