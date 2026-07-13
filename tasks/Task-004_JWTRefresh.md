# Task-004_JWTRefresh.md

**Project:** ASTER\
**Task ID:** TASK-004\
**Title:** JWT Refresh Token & Session Lifecycle\
**Priority:** P0\
**Estimated Effort:** 2\~3 hours

------------------------------------------------------------------------

# Objective

Access Token이 만료되어도 사용자가 서비스를 끊김 없이 사용할 수 있도록
Refresh Token 기반 세션 유지 기능을 구현한다.

------------------------------------------------------------------------

# Related Documents

-   06_PRD_Authentication.md
-   19_PRD_Subscription.md
-   21_PRD_APIContract.md
-   22_DatabaseArchitecture.md
-   23_BackendArchitecture.md
-   29_SecurityArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

사용자는 작업 중 로그인 상태가 자연스럽게 유지되기를 원한다. Refresh
Token이 유효한 경우 다시 로그인하지 않아도 서비스를 계속 사용할 수
있어야 한다.

------------------------------------------------------------------------

# Scope

포함 - Refresh Token 발급 - Refresh Token Rotation - Access Token
재발급 - 토큰 만료 처리 - 로그아웃 시 Refresh Token 무효화

제외 - OAuth - 이메일 인증 - 비밀번호 재설정

------------------------------------------------------------------------

# Functional Requirements

-   Access Token은 짧은 만료 시간을 사용한다.
-   Refresh Token은 서버 정책에 따라 관리한다.
-   Refresh 요청 시 기존 Refresh Token은 폐기하고 새 토큰을 발급한다.
-   유효하지 않은 Refresh Token은 즉시 거부한다.
-   Refresh 실패 시 로그인 화면으로 이동한다.

------------------------------------------------------------------------

# Backend Tasks

-   RefreshTokenUseCase 작성
-   TokenService 구현
-   Refresh Rotation 구현
-   토큰 검증 미들웨어
-   Activity Log 기록

------------------------------------------------------------------------

# Frontend Tasks

-   Silent Refresh 구현
-   Session Restore
-   인증 만료 처리
-   로그인 페이지 리다이렉트

------------------------------------------------------------------------

# API

## POST /auth/refresh

Request

``` json
{
  "refreshToken": "<token>"
}
```

Response

``` json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<new_refresh_token>"
  }
}
```

------------------------------------------------------------------------

# Security Requirements

-   Refresh Token 재사용 방지
-   HTTPS 전송
-   HttpOnly Cookie 사용 권장
-   토큰 원문 로그 기록 금지

------------------------------------------------------------------------

# Database

사용 테이블

-   users
-   activity_logs
-   (필요 시) refresh_tokens

------------------------------------------------------------------------

# Acceptance Criteria

-   Access Token 자동 재발급
-   Rotation 정상 동작
-   만료 토큰 차단
-   로그아웃 시 토큰 무효화

------------------------------------------------------------------------

# Test Checklist

-   정상 Refresh
-   만료된 Refresh Token
-   위조 Token
-   재사용 Token
-   동시 Refresh 요청

------------------------------------------------------------------------

# Files Expected

Backend - modules/auth/application/ - modules/auth/domain/ -
modules/auth/infrastructure/

Frontend - features/auth/ - stores/auth/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   Refresh 기능 구현
-   Rotation 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과
-   문서와 일치

------------------------------------------------------------------------

# Claude Code Execution Prompt

관련 설계 문서를 먼저 읽고 구현한다. Refresh Token은 Rotation 방식을
사용한다. 토큰 검증 로직은 공통 서비스로 분리한다. Route Handler에는
비즈니스 로직을 작성하지 않는다. Unit, Integration, E2E 테스트를 함께
작성한다.

End of Document
