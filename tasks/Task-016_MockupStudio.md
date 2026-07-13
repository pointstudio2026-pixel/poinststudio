# Task-016_MockupStudio

**Project:** ASTER **Task ID:** TASK-016 **Title:** Mockup Studio
**Priority:** P0 **Estimated Effort:** 6\~8 hours

------------------------------------------------------------------------

# Objective

선택된 로고 컨셉을 다양한 실제 환경에 자동 적용하여 클라이언트가 브랜드
적용 모습을 즉시 확인할 수 있는 Mockup Studio를 구현한다.

Mockup은 디자인 결과를 검증하고 제안하는 보조 도구이며, 최종 디자인을
대체하지 않는다.

------------------------------------------------------------------------

# Related Documents

-   15_PRD_ImageGeneration.md
-   16_PRD_OneClickEdit.md
-   17_PRD_ConceptBoard.md
-   18_PRD_MockupStudio.md
-   22_DatabaseArchitecture.md
-   25_AIProviderArchitecture.md
-   26_QueueAndJobArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 생성된 로고를 명함, 간판, 패키지 등에 자동 적용하여 실제
사용 모습을 빠르게 확인하고 클라이언트에게 제안하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - Mockup 템플릿 선택 - 자동 합성 - 다중 Mockup 생성 - Mockup 저장 -
즐겨찾기 - 버전 관리

제외 - PDF Export - 인쇄 파일 생성

------------------------------------------------------------------------

# Functional Requirements

-   템플릿 카테고리 제공
-   로고 자동 배치
-   배경 유지
-   고해상도 미리보기
-   프로젝트별 저장
-   재생성 지원

------------------------------------------------------------------------

# Mockup Categories

-   Business Card
-   Stationery
-   Signboard
-   Packaging
-   Coffee Cup
-   Shopping Bag
-   T-shirt
-   Mobile App
-   Website Hero
-   Social Media

------------------------------------------------------------------------

# Workflow

Generation Version → Mockup Selection → Queue → Render Worker → Preview
→ Save → Concept Board Link

------------------------------------------------------------------------

# Backend Tasks

-   CreateMockupUseCase
-   MockupTemplateRepository
-   RenderWorker
-   MockupStorageService
-   UsageRecorder

------------------------------------------------------------------------

# Frontend Tasks

-   Mockup Gallery
-   Category Filter
-   Preview Viewer
-   Favorite Button
-   Download Preview

------------------------------------------------------------------------

# API

POST /mockups/render

GET /mockups/{projectId}

POST /mockups/favorite

DELETE /mockups/{id}

------------------------------------------------------------------------

# Database

-   mockup_projects
-   generation_versions
-   activity_logs
-   usage_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   Mockup 생성 성공
-   카테고리 필터 동작
-   즐겨찾기 저장
-   프로젝트 연결
-   Queue 기반 렌더링

------------------------------------------------------------------------

# Test Checklist

-   템플릿 변경
-   여러 Mockup 생성
-   렌더 실패 재시도
-   즐겨찾기
-   권한 검증
-   사용량 기록

------------------------------------------------------------------------

# Files Expected

Backend - modules/mockups/ - workers/

Frontend - features/mockups/ - components/mockups/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   Mockup Studio 구현
-   Queue 연동
-   템플릿 시스템 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Mockup은 원본 이미지를 변경하지 않는다. 모든 렌더링은 Queue 기반으로
수행하며 새로운 Mockup Project를 생성한다. 템플릿은 확장 가능한 구조로
설계하고 Concept Board와 연동한다.

End of Document
