# Task-024_APIPlatform

**Project:** ASTER **Task ID:** TASK-024 **Title:** Public API Platform
**Priority:** P2 **Estimated Effort:** 8\~10 hours

------------------------------------------------------------------------

# Objective

ASTER 기능을 외부 애플리케이션과 연동할 수 있도록 공개 API 플랫폼과 API
Key 관리 기능을 구현한다.

------------------------------------------------------------------------

# Related Documents

-   21_PRD_APIContract.md
-   23_BackendArchitecture.md
-   29_SecurityArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

개발자로서 API Key를 발급받아 ASTER의 브랜드 분석과 생성 기능을 내
서비스에서 사용하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - API Key 발급 - API Key 폐기 - Rate Limit - API Usage - API 문서 -
API 버전 관리

제외 - SDK 제공 - Marketplace

------------------------------------------------------------------------

# Functional Requirements

-   API Key 생성/재발급
-   프로젝트별 API 권한
-   Rate Limit 적용
-   API 호출 로그
-   API 버전(v1) 지원
-   API 상태 페이지 연동

------------------------------------------------------------------------

# Workflow

Developer → API Key → Authenticate → Request → Rate Limit → Response →
Usage Log

------------------------------------------------------------------------

# Backend Tasks

-   ApiKeyUseCase
-   ApiGatewayMiddleware
-   RateLimiter
-   UsageLogger
-   VersionRouter

------------------------------------------------------------------------

# Frontend Tasks

-   Developer Portal
-   API Key Manager
-   Usage Dashboard
-   API Documentation

------------------------------------------------------------------------

# API

POST /developer/api-keys

GET /developer/api-keys

DELETE /developer/api-keys/{id}

GET /developer/usage

------------------------------------------------------------------------

# Database

-   api_keys
-   api_usage_logs
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   API Key 발급
-   인증 성공
-   Rate Limit 동작
-   사용량 집계
-   로그 기록

------------------------------------------------------------------------

# Test Checklist

-   유효한 Key
-   만료 Key
-   폐기 Key
-   Rate Limit 초과
-   권한 검증

------------------------------------------------------------------------

# Definition of Done

-   API Platform 구현
-   API Key 관리
-   Usage 집계
-   테스트 통과
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

API Key는 해시 저장하며 원문은 재조회하지 않는다. 모든 공개 API는 버전
관리와 Rate Limit를 적용한다. Provider 의존성을 노출하지 않는다.

End of Document
