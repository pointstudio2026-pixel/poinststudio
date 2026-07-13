# Task-002_Authentication.md

**Project:** ASTER **Task ID:** TASK-002 **Title:** User Authentication
**Priority:** P0 **Estimated Effort:** 4 hours

------------------------------------------------------------------------

# Objective

사용자가 안전하게 회원가입, 로그인하고 인증된 상태로 ASTER 서비스를
사용할 수 있도록 인증 시스템의 기반을 구현한다.

------------------------------------------------------------------------

# Related Documents

-   06_PRD_Authentication.md
-   21_PRD_APIContract.md
-   22_DatabaseArchitecture.md
-   23_BackendArchitecture.md
-   24_FrontendArchitecture.md
-   29_SecurityArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 계정을 생성하고 로그인하여 내 프로젝트만 안전하게 관리하고
싶다.

------------------------------------------------------------------------

# Scope

포함 - 회원가입 - 로그인 - 로그아웃 - JWT Access Token - Refresh Token -
인증 미들웨어

제외 - OAuth - 비밀번호 재설정 - 이메일 인증

------------------------------------------------------------------------

# Functional Requirements

-   이메일 중복 검사
-   비밀번호 Hash 저장
-   JWT 발급
-   Refresh Token 저장
-   인증 사용자만 API 접근

------------------------------------------------------------------------

# Backend Tasks

-   RegisterUseCase
-   LoginUseCase
-   LogoutUseCase
-   Auth Middleware
-   Password Hashing
-   JWT Service

------------------------------------------------------------------------

# Frontend Tasks

-   회원가입 화면
-   로그인 화면
-   입력 검증
-   인증 상태 관리
-   로그인 유지

------------------------------------------------------------------------

# API

POST /auth/register

POST /auth/login

POST /auth/logout

GET /auth/me

------------------------------------------------------------------------

# Database

-   users
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   회원가입 성공
-   로그인 성공
-   JWT 발급
-   인증 API 접근 성공
-   비인증 접근 차단

------------------------------------------------------------------------

# Test Checklist

-   정상 회원가입
-   이메일 중복
-   잘못된 비밀번호
-   만료 토큰
-   권한 없는 접근

------------------------------------------------------------------------

# Files Expected

Backend - modules/auth/ - app/api/auth/

Frontend - features/auth/ - stores/auth/

Tests - unit - integration

------------------------------------------------------------------------

# Definition of Done

-   인증 구현
-   테스트 통과
-   Lint 통과
-   타입 오류 없음
-   문서와 일치

------------------------------------------------------------------------

# Claude Code Execution Prompt

관련 설계 문서를 먼저 읽고 구현한다. 비밀번호는 Argon2 또는 bcrypt로
해시한다. JWT와 Refresh Token은 서버 정책에 맞게 관리한다. Route
Handler에는 비즈니스 로직을 작성하지 않는다. Unit Test와 Integration
Test를 반드시 작성한다.

End of Document
