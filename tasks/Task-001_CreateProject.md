# Task-001_CreateProject.md

**Project:** ASTER **Task ID:** TASK-001 **Title:** Create Project
Feature **Priority:** P0 **Estimated Effort:** 3\~4 hours

------------------------------------------------------------------------

# Objective

사용자가 새로운 브랜드 프로젝트를 생성할 수 있는 기능을 구현한다.

이 Task는 이후 Brand Interview부터 모든 워크플로의 시작점이다.

------------------------------------------------------------------------

# Related Documents

-   00_Vision.md
-   01_ProductArchitecture.md
-   04_DomainArchitecture.md
-   07_PRD_Dashboard.md
-   08_PRD_ProjectWorkspace.md
-   21_PRD_APIContract.md
-   22_DatabaseArchitecture.md
-   23_BackendArchitecture.md
-   24_FrontendArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

> 디자이너로서 새로운 브랜드 프로젝트를 생성하고, 이후 브랜드 인터뷰를
> 바로 시작하고 싶다.

------------------------------------------------------------------------

# Scope

포함

-   프로젝트 생성 버튼
-   프로젝트 생성 모달
-   프로젝트 이름 입력
-   프로젝트 생성 API
-   프로젝트 저장
-   Dashboard 갱신
-   Brand Interview 첫 단계로 이동

제외

-   Brand Interview 구현
-   Style Engine
-   이미지 생성

------------------------------------------------------------------------

# Functional Requirements

-   프로젝트 이름은 필수
-   최대 길이 100자
-   사용자별 프로젝트 생성
-   생성 후 status=draft
-   current_step=brand_interview

------------------------------------------------------------------------

# Backend Tasks

-   CreateProjectUseCase 작성
-   ProjectRepository 구현
-   POST /projects API
-   Validation(Zod)
-   Activity Log 기록

------------------------------------------------------------------------

# Frontend Tasks

-   "새 프로젝트" 버튼
-   생성 모달
-   Form Validation
-   API 호출
-   성공 시 프로젝트 화면 이동

------------------------------------------------------------------------

# Database

사용 테이블

-   users
-   projects
-   activity_logs

------------------------------------------------------------------------

# API

POST /projects

Request

``` json
{
  "name":"My Brand"
}
```

Response

``` json
{
  "success":true,
  "data":{
    "projectId":"uuid",
    "status":"draft"
  }
}
```

------------------------------------------------------------------------

# Acceptance Criteria

-   프로젝트 생성 성공
-   DB 저장 확인
-   사용자 소유권 확인
-   Dashboard 갱신
-   Brand Interview 이동

------------------------------------------------------------------------

# Test Checklist

-   정상 생성
-   이름 미입력
-   100자 초과
-   인증 없는 요청
-   다른 사용자 프로젝트 접근 불가

------------------------------------------------------------------------

# Files Expected

Backend - modules/projects/application/ - modules/projects/domain/ -
modules/projects/infrastructure/ - app/api/projects/

Frontend - features/projects/ - components/project/

Tests - unit - integration

------------------------------------------------------------------------

# Definition of Done

-   기능 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과
-   문서와 일치

------------------------------------------------------------------------

# Claude Code Execution Prompt

이 Task와 관련 문서를 먼저 읽은 뒤 구현한다. Use Case 패턴을 사용하고
Route Handler에 비즈니스 로직을 작성하지 않는다. Prisma는
Repository에서만 사용한다. Unit Test와 Integration Test를 함께 작성한다.

End of Document
