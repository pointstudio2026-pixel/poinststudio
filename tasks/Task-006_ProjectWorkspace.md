# Task-006_ProjectWorkspace

## Project

ASTER

## Task ID

TASK-006

## Title

Project Workspace

## Priority

P0

## Estimated Effort

4\~5 hours

## Objective

브랜드 프로젝트의 전체 작업 공간을 구현한다. 사용자는 프로젝트 상태를
확인하고 Brand Interview부터 Concept Board까지 하나의 화면에서 진행한다.

## Related Documents

08_PRD_ProjectWorkspace.md 09_PRD_BrandInterview.md 10_PRD_BrandBrief.md
17_PRD_ConceptBoard.md 23_BackendArchitecture.md
24_FrontendArchitecture.md 30_CLAUDE.md

## User Story

디자이너로서 프로젝트의 현재 단계와 결과물을 한 화면에서 관리하고 싶다.

## Scope

포함: 프로젝트 헤더, 진행 단계(Stepper), 좌측 네비게이션, 작업 영역,
자동 저장 상태, 활동 로그 제외: AI 생성 로직 자체 구현

## Functional Requirements

-   프로젝트 이름 수정
-   현재 단계 표시
-   Step 이동 제어
-   자동 저장 상태 표시
-   프로젝트 즐겨찾기
-   프로젝트 삭제/보관

## UI Components

Project Header Progress Stepper Left Navigation Main Workspace Auto Save
Indicator Activity Timeline

## Backend Tasks

GetProjectWorkspaceUseCase UpdateProjectUseCase ActivityLog 조회 Project
Version 조회

## Frontend Tasks

Workspace Layout Progress Stepper Resizable Panels Auto Save Badge
Breadcrumb

## API

GET /projects/{id} PATCH /projects/{id} GET /projects/{id}/activity

## Database

projects project_versions activity_logs

## Acceptance Criteria

프로젝트 로드 성공 현재 단계 표시 자동 저장 상태 표시 활동 로그 조회

## Test Checklist

존재하지 않는 프로젝트 다른 사용자 프로젝트 접근 자동 저장 프로젝트 이름
변경 삭제 후 접근

## Files Expected

Backend: modules/projects/ Frontend: features/workspace/ Tests:
unit/integration/e2e

## Definition of Done

Workspace 구현, API 연동, 테스트 통과, 타입 오류 없음, Lint 통과

## Claude Code Execution Prompt

Workspace는 모든 기능의 허브이다. 비즈니스 로직은 Use Case에 구현하고,
자동 저장은 낙관적 UI가 아닌 서버 응답 기준으로 표시한다. 관련 문서를
먼저 읽고 구현한다.
