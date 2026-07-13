# Task-020_AdminDashboard

**Project:** ASTER **Task ID:** TASK-020 **Title:** Admin Dashboard
**Priority:** P1 **Estimated Effort:** 7\~9 hours

------------------------------------------------------------------------

# Objective

ASTER 운영자가 사용자, 구독, AI Provider, 시스템 상태를 한 곳에서 관리할
수 있는 관리자 대시보드를 구현한다.

관리 기능은 일반 사용자 기능과 완전히 분리하며, 모든 관리자 작업은 Audit
Log를 남긴다.

------------------------------------------------------------------------

# Related Documents

-   19_PRD_Subscription.md
-   21_PRD_APIContract.md
-   22_DatabaseArchitecture.md
-   23_BackendArchitecture.md
-   25_AIProviderArchitecture.md
-   27_DeploymentArchitecture.md
-   29_SecurityArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

운영자로서 서비스 상태와 원가를 실시간으로 확인하고 문제가 발생하면
빠르게 대응하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - 관리자 로그인 확인 - 사용자 관리 - 프로젝트 통계 - 구독 현황 - AI
Provider 상태 - Queue 상태 - 원가 분석 - Audit Log 조회

제외 - 일반 사용자 기능 - 고객지원 채팅

------------------------------------------------------------------------

# Functional Requirements

-   관리자 권한 검증
-   사용자 검색
-   플랜별 통계
-   일/월 원가 분석
-   Provider Health 표시
-   Queue 길이 표시
-   시스템 공지 관리
-   Audit Log 검색

------------------------------------------------------------------------

# Dashboard Widgets

-   Daily Active Users
-   New Projects
-   AI Cost
-   Revenue
-   Provider Health
-   Queue Status
-   Usage Trend
-   Error Rate

------------------------------------------------------------------------

# Workflow

Admin Login → Dashboard → Analytics → User Management → System
Monitoring → Audit Review

------------------------------------------------------------------------

# Backend Tasks

-   AdminDashboardUseCase
-   UserManagementService
-   AnalyticsService
-   ProviderHealthService
-   AuditLogService

------------------------------------------------------------------------

# Frontend Tasks

-   Admin Layout
-   Analytics Charts
-   User Table
-   Provider Status Cards
-   Queue Monitor
-   Audit Log Viewer

------------------------------------------------------------------------

# API

GET /admin/dashboard

GET /admin/users

GET /admin/analytics

GET /admin/providers

GET /admin/audit-logs

------------------------------------------------------------------------

# Database

-   users
-   subscriptions
-   usage_logs
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   관리자만 접근 가능
-   통계 정상 표시
-   Provider 상태 표시
-   Audit Log 조회
-   사용자 검색 가능

------------------------------------------------------------------------

# Test Checklist

-   권한 없는 접근
-   통계 조회
-   사용자 검색
-   Provider 장애 표시
-   Queue 상태 확인
-   Audit Log 필터

------------------------------------------------------------------------

# Files Expected

Backend - modules/admin/

Frontend - features/admin/ - components/admin/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   관리자 Dashboard 구현
-   Analytics 구현
-   Audit Log 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

관리자 기능은 반드시 Role 기반 권한 검사를 수행한다. 모든 관리자 작업은
Audit Log를 기록한다. 운영 통계는 읽기 전용으로 제공하며 시스템 안정성을
우선한다.

End of Document
