# 08_PRD_ProjectWorkspace

Project: ASTER Version: 2.0 (AI-Native Specification) Status: Draft

------------------------------------------------------------------------

# Feature ID

PRD-003

Feature Name

Project Workspace

Priority

P0 (Core)

------------------------------------------------------------------------

# Goal

Project Workspace는 ASTER의 핵심 작업 공간이다.

모든 브랜딩 작업은 이 화면에서 시작하며, Brand Interview → Aster Brain →
Brand Brief → Brand Strategy → Generation으로 이어지는 워크플로를
제공한다.

------------------------------------------------------------------------

# User Stories

US-001 사용자는 새 프로젝트를 생성할 수 있다.

US-002 사용자는 프로젝트를 자동 저장할 수 있다.

US-003 사용자는 언제든 이전 버전으로 돌아갈 수 있다.

US-004 사용자는 프로젝트 진행 상태를 확인할 수 있다.

------------------------------------------------------------------------

# Screen Layout

Header - Project Name - Save Status - Version Selector - Export - User
Menu

Left Sidebar - Brand Interview - Brand Brief - Brand Strategy - Style -
Generation - Concept Board - Mockup

Main Workspace - 현재 단계 화면 - 진행 상태 - AI 결과 - 수정 패널

Right Panel - AI Suggestions - Project Notes - Activity History

------------------------------------------------------------------------

# Workflow

Create Project → Brand Interview → Aster Brain → Brand Brief → Brand
Strategy → Style Selection → Image Generation → One Click Edit → Concept
Board → Mockup → Export

------------------------------------------------------------------------

# Components

-   Progress Stepper
-   Auto Save Indicator
-   Version History
-   AI Suggestion Panel
-   Notes Panel
-   Activity Timeline

------------------------------------------------------------------------

# State Machine

Idle → Editing → Auto Saving → Saved

Editing → Brand Analysis → Generation → Editing

Error → Retry

------------------------------------------------------------------------

# Auto Save

-   변경 후 5초 이내 자동 저장
-   저장 중 상태 표시
-   저장 실패 시 재시도
-   수동 저장 가능

------------------------------------------------------------------------

# Version Management

-   생성 시 버전 생성
-   원클릭 수정 시 새 버전 생성
-   사용자가 버전 이름 지정 가능
-   이전 버전 복원 가능

------------------------------------------------------------------------

# Business Rules

-   프로젝트는 사용자별 분리
-   자동 저장은 기본 활성화
-   삭제 프로젝트는 휴지통으로 이동
-   프로젝트명은 중복 허용

------------------------------------------------------------------------

# API

POST /projects GET /projects/{id} PATCH /projects/{id} POST
/projects/{id}/autosave GET /projects/{id}/versions POST
/projects/{id}/restore

------------------------------------------------------------------------

# Database

projects project_versions project_notes activities

------------------------------------------------------------------------

# AI Sequence

Open Workspace → Load Project → Load Brand Brief → Load Strategy →
Restore Session → Ready

------------------------------------------------------------------------

# Error Handling

PW-001 Project Not Found PW-002 Auto Save Failed PW-003 Version Restore
Failed PW-004 Permission Denied

------------------------------------------------------------------------

# Acceptance Criteria

-   프로젝트 생성 성공
-   자동 저장 동작
-   버전 복원 가능
-   각 단계 이동 가능
-   진행 상태 표시

------------------------------------------------------------------------

# Definition of Done

-   UI 구현
-   Backend 구현
-   Auto Save 테스트
-   Version 테스트
-   문서 업데이트 완료

------------------------------------------------------------------------

# Claude Code Instructions

-   이전 문서(00\~07)를 반드시 읽는다.
-   Project Workspace를 ASTER의 중심 화면으로 구현한다.
-   모든 하위 기능은 독립 컴포넌트로 분리한다.
-   Auto Save와 Version 기능을 기본 구조에 포함한다.

End of Document
