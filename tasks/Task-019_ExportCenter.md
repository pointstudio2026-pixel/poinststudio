# Task-019_ExportCenter

**Project:** ASTER **Task ID:** TASK-019 **Title:** Export Center
**Priority:** P1 **Estimated Effort:** 6\~8 hours

------------------------------------------------------------------------

# Objective

Brand Brief, Brand Strategy, Concept Board, Mockup을 다양한 형식으로
내보낼 수 있는 Export Center를 구현한다.

Export는 디자이너가 결과물을 클라이언트와 공유하기 위한 최종 전달
기능이다.

------------------------------------------------------------------------

# Related Documents

-   17_PRD_ConceptBoard.md
-   18_PRD_MockupStudio.md
-   19_PRD_Subscription.md
-   23_BackendArchitecture.md
-   24_FrontendArchitecture.md
-   26_QueueAndJobArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 작업 결과를 PDF, PNG 등으로 손쉽게 내보내고 클라이언트에게
전달하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - PDF Export - PNG Export - JPG Export - PPTX(확장 구조) - 다운로드
이력 - Queue 기반 Export

제외 - 이메일 발송 - 인쇄 주문

------------------------------------------------------------------------

# Functional Requirements

-   선택한 섹션만 Export 가능
-   고해상도 출력
-   브랜드 정보 포함 여부 선택
-   워터마크 정책(플랜별)
-   Export 진행 상태 표시
-   재시도 지원

------------------------------------------------------------------------

# Workflow

Concept Board → Export Request → Queue → Render Worker → File Storage →
Download

------------------------------------------------------------------------

# Backend Tasks

-   CreateExportUseCase
-   ExportWorker
-   PdfRenderer
-   ImageRenderer
-   ExportHistoryService

------------------------------------------------------------------------

# Frontend Tasks

-   Export Dialog
-   Format Selector
-   Quality Selector
-   Progress UI
-   Download Center

------------------------------------------------------------------------

# API

POST /exports

GET /exports/{projectId}

GET /exports/status/{exportId}

------------------------------------------------------------------------

# Database

-   activity_logs
-   usage_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   PDF 생성
-   PNG 생성
-   Queue 기반 처리
-   다운로드 가능
-   Export 이력 저장

------------------------------------------------------------------------

# Test Checklist

-   PDF Export
-   PNG Export
-   실패 후 재시도
-   권한 검증
-   구독 제한 확인

------------------------------------------------------------------------

# Files Expected

Backend - modules/exports/ - workers/

Frontend - features/export/ - components/export/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   Export 기능 구현
-   Queue 연동
-   다운로드 구현
-   테스트 통과
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Export는 비동기 Queue로 처리한다. 생성된 파일은 Object Storage에
저장하고 Signed URL로 다운로드를 제공한다. 플랜 정책에 따라 Export
기능과 워터마크를 적용한다.

End of Document
