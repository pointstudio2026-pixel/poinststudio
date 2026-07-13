# Task-003_LoginFlow.md

**Project:** ASTER **Task ID:** TASK-003 **Title:** Login Flow & Session
Management **Priority:** P0 **Estimated Effort:** 3\~4 hours

------------------------------------------------------------------------

# Objective

사용자가 로그인 이후 자연스럽게 Dashboard까지 이동하고, 세션을 유지하며
안전하게 로그아웃할 수 있는 전체 로그인 플로우를 구현한다.

------------------------------------------------------------------------

# Related Documents

-   06_PRD_Authentication.md
-   07_PRD_Dashboard.md
-   21_PRD_APIContract.md
-   23_BackendArchitecture.md
-   24_FrontendArchitecture.md
-   29_SecurityArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

사용자로서 로그인 후 바로 내 프로젝트를 확인하고, 브라우저를
새로고침해도 로그인 상태가 유지되길 원한다.

------------------------------------------------------------------------

# Scope

포함 - 로그인 성공 처리 - Dashboard 리다이렉트 - Session 복원 - Refresh
Token 재발급 - 자동 로그아웃 - 로그아웃 플로우

제외 - OAuth 로그인 - 이메일 인증 - 비밀번호 찾기

------------------------------------------------------------------------

# Functional Requirements

-   로그인 성공 시 Dashboard 이동
-   Access Token 만료 시 Refresh 수행
-   Refresh 실패 시 로그인 화면 이동
-   로그아웃 시 모든 인증 정보 제거
-   보호된 페이지는 인증 필수

------------------------------------------------------------------------

# Frontend Tasks

-   Login Form
-   Loading UI
-   Auth Guard
-   Session Restore
-   Logout Button
-   Redirect Logic

------------------------------------------------------------------------

# Backend Tasks

-   /auth/refresh API
-   토큰 검증
-   Refresh Rotation
-   Session Validation
-   Audit Log 기록

------------------------------------------------------------------------

# State Flow

Logged Out → Login → Authenticated → Token Expired → Refresh →
Authenticated

실패 시

Authenticated → Refresh Failed → Logged Out

------------------------------------------------------------------------

# API

POST /auth/login

POST /auth/refresh

POST /auth/logout

GET /auth/me

------------------------------------------------------------------------

# Database

-   users
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   로그인 성공
-   Dashboard 이동
-   새로고침 후 세션 유지
-   Refresh 정상 동작
-   로그아웃 성공

------------------------------------------------------------------------

# Test Checklist

-   정상 로그인
-   잘못된 비밀번호
-   Access Token 만료
-   Refresh Token 만료
-   보호 페이지 접근
-   로그아웃 후 접근 차단

------------------------------------------------------------------------

# Files Expected

Backend - modules/auth/application/ - modules/auth/presentation/

Frontend - features/auth/ - middleware/ - stores/auth/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   로그인 플로우 구현
-   Session Restore 구현
-   Auth Guard 구현
-   테스트 통과
-   타입 오류 없음
-   문서와 일치

------------------------------------------------------------------------

# Claude Code Execution Prompt

관련 설계 문서를 먼저 읽는다. 인증 상태는 서버 기준으로 판단한다. Access
Token과 Refresh Token의 책임을 명확히 분리한다. 보호된 라우트는 공통
Auth Guard를 사용한다. Unit, Integration, E2E 테스트를 함께 작성한다.

End of Document
