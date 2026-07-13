# Task-015_ConceptBoardGeneration

**Project:** ASTER **Task ID:** TASK-015 **Title:** Concept Board
Generation **Priority:** P0 **Estimated Effort:** 6\~8 hours

------------------------------------------------------------------------

# Objective

선택된 브랜드 전략, 스타일, 생성 이미지를 기반으로 자동으로 브랜드
컨셉보드를 생성한다.

컨셉보드는 디자이너가 클라이언트에게 방향성을 설명하고 비교할 수 있는
핵심 산출물이다.

------------------------------------------------------------------------

# Related Documents

-   17_PRD_ConceptBoard.md
-   18_PRD_MockupStudio.md
-   20_PRD_DesignMemory.md
-   22_DatabaseArchitecture.md
-   23_BackendArchitecture.md
-   24_FrontendArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 생성된 결과를 보기 좋게 정리한 브랜드 컨셉보드를 자동으로
만들고, 필요하면 항목을 수정해 클라이언트에게 제안하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - 컨셉보드 자동 생성 - 컬러 팔레트 - 타이포그래피 제안 - 스타일
키워드 - 브랜드 설명 - 대표 이미지 선택 - 버전 관리

제외 - PDF Export - 목업 렌더링

------------------------------------------------------------------------

# Functional Requirements

-   Brand Brief 기반 구성
-   대표 이미지 선택
-   브랜드 설명 자동 생성
-   컬러/폰트/키워드 배치
-   섹션 순서 변경
-   버전 생성 및 복원

------------------------------------------------------------------------

# Layout Sections

-   Hero Image
-   Brand Summary
-   Core Values
-   Style Keywords
-   Color Palette
-   Typography Direction
-   Logo Concepts
-   Design Notes

------------------------------------------------------------------------

# Workflow

Brand Brief → Brand Strategy → Selected Style → Image Selection →
Concept Board Builder → User Edit → Save Version

------------------------------------------------------------------------

# API

POST /concept-board/generate

GET /concept-board/{projectId}

PATCH /concept-board/{projectId}

POST /concept-board/{projectId}/version

------------------------------------------------------------------------

# Database

-   concept_boards
-   concept_board_versions
-   generation_versions
-   activity_logs

------------------------------------------------------------------------

# Backend Tasks

-   BuildConceptBoardUseCase
-   ConceptBoardComposer
-   VersionManager
-   LayoutSerializer

------------------------------------------------------------------------

# Frontend Tasks

-   Concept Board Canvas
-   Section Editor
-   Drag & Drop Ordering
-   Inline Text Edit
-   Version Timeline

------------------------------------------------------------------------

# Acceptance Criteria

-   컨셉보드 자동 생성
-   섹션 편집 가능
-   버전 저장
-   대표 이미지 변경 가능
-   레이아웃 유지

------------------------------------------------------------------------

# Test Checklist

-   자동 생성
-   이미지 없음
-   텍스트 수정
-   순서 변경
-   버전 복원
-   권한 검증

------------------------------------------------------------------------

# Files Expected

Backend - modules/concept-boards/

Frontend - features/concept-board/ - components/concept-board/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   Concept Board 생성
-   편집 기능 구현
-   버전 관리
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Concept Board는 단순 이미지 갤러리가 아니라 브랜드 제안서이다. 모든
요소는 Brand Brief와 Brand Strategy를 기준으로 구성한다. 사용자 편집
후에도 원본 버전은 유지하며 새 버전을 생성한다.

End of Document
