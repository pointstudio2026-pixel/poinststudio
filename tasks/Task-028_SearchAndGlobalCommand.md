# Task-028_SearchAndGlobalCommand

**Project:** ASTER **Task ID:** TASK-028 **Title:** Search & Global
Command Palette **Priority:** P2 **Estimated Effort:** 6\~8 hours

------------------------------------------------------------------------

# Objective

프로젝트, 브랜드, 스타일, 컨셉보드 등을 빠르게 찾고 주요 기능을
키보드만으로 실행할 수 있는 전역 검색 및 Command Palette를 구현한다.

------------------------------------------------------------------------

# Related Documents

-   08_PRD_ProjectWorkspace.md
-   12_PRD_StyleEngine.md
-   17_PRD_ConceptBoard.md
-   23_BackendArchitecture.md
-   24_FrontendArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 수많은 프로젝트와 기능을 마우스 없이 빠르게 검색하고
실행하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - 전역 검색 - Command Palette - 최근 검색 - 최근 실행 - 단축키 -
검색 필터

제외 - 자연어 검색 - 음성 검색

------------------------------------------------------------------------

# Functional Requirements

-   프로젝트 검색
-   브랜드명 검색
-   스타일 검색
-   최근 프로젝트
-   Ctrl/Cmd + K 실행
-   검색 결과 하이라이트

------------------------------------------------------------------------

# Workflow

Shortcut → Command Palette → Search → Filter → Select → Navigate /
Execute

------------------------------------------------------------------------

# Backend Tasks

-   SearchUseCase
-   SearchIndexService
-   RecentSearchService

------------------------------------------------------------------------

# Frontend Tasks

-   Command Palette
-   Search Input
-   Result List
-   Keyboard Navigation
-   Recent Items

------------------------------------------------------------------------

# API

GET /search GET /search/recent POST /search/recent

------------------------------------------------------------------------

# Database

-   search_history
-   projects
-   styles
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   검색 결과 표시
-   단축키 동작
-   최근 검색 저장
-   키보드 탐색 지원
-   프로젝트 이동 성공

------------------------------------------------------------------------

# Test Checklist

-   빈 검색
-   대량 프로젝트 검색
-   최근 검색
-   단축키 실행
-   권한 없는 프로젝트 제외

------------------------------------------------------------------------

# Definition of Done

-   Search 구현
-   Command Palette 구현
-   Keyboard Navigation 구현
-   테스트 통과
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

검색은 빠른 응답을 우선하며 필요한 경우 인덱스를 활용한다. Command
Palette는 모든 주요 기능의 진입점으로 설계한다. 권한이 없는 프로젝트와
데이터는 검색 결과에서 제외한다.

End of Document
