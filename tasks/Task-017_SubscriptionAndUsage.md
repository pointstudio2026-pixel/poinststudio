# Task-017_SubscriptionAndUsage

**Project:** ASTER **Task ID:** TASK-017 **Title:** Subscription & Usage
Management **Priority:** P0 **Estimated Effort:** 6\~8 hours

------------------------------------------------------------------------

# Objective

ASTER의 무료 및 유료 구독 시스템과 사용량(Usage) 관리 기능을 구현한다.

서비스 원가를 추적하고 플랜별 기능 제한을 적용하여 목표 원가율(20%)을
유지한다.

------------------------------------------------------------------------

# Related Documents

-   19_PRD_Subscription.md
-   21_PRD_APIContract.md
-   22_DatabaseArchitecture.md
-   23_BackendArchitecture.md
-   25_AIProviderArchitecture.md
-   29_SecurityArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 내 플랜과 남은 생성 횟수를 쉽게 확인하고, 필요할 때
업그레이드하여 더 많은 기능을 사용하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - 무료 / Pro / Studio 플랜 - 사용량 집계 - 생성 제한 - 업그레이드
준비 구조 - 원가 기록 - 사용량 대시보드

제외 - 실제 PG 결제 연동 - 환불 처리

------------------------------------------------------------------------

# Functional Requirements

-   플랜별 생성 한도 적용
-   이미지 생성 시 사용량 차감
-   AI 호출 원가 기록
-   월간 사용량 초기화 정책
-   한도 초과 시 차단 및 안내
-   관리자 사용량 조회

------------------------------------------------------------------------

# Plan Policy

Free - 기본 생성 횟수 제공

Pro - 생성 한도 증가 - 우선 Queue - 추가 기능 제공

Studio - 최고 한도 - 최고 우선순위 - 팀 기능 확장 가능 구조

------------------------------------------------------------------------

# Workflow

User → Plan Check → Usage Check → AI Request → Usage Record → Cost
Record → Dashboard Update

------------------------------------------------------------------------

# Backend Tasks

-   CheckPlanUseCase
-   RecordUsageUseCase
-   UsageSummaryService
-   CostTrackingService
-   MonthlyResetJob

------------------------------------------------------------------------

# Frontend Tasks

-   Subscription Page
-   Usage Widget
-   Plan Comparison
-   Upgrade Dialog
-   Remaining Usage Indicator

------------------------------------------------------------------------

# API

GET /subscription

GET /subscription/usage

POST /subscription/check

GET /subscription/plans

------------------------------------------------------------------------

# Database

-   subscriptions
-   usage_logs
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   플랜 조회
-   사용량 차감
-   한도 적용
-   원가 기록
-   대시보드 반영

------------------------------------------------------------------------

# Test Checklist

-   Free 한도 초과
-   Pro 사용량
-   Studio 사용량
-   월간 초기화
-   관리자 조회
-   권한 검증

------------------------------------------------------------------------

# Files Expected

Backend - modules/subscriptions/

Frontend - features/subscription/ - components/subscription/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   구독 기능 구현
-   사용량 집계 구현
-   원가 추적 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

모든 AI 요청 전에 플랜과 사용량을 확인한다. 사용량과 원가는 동일
트랜잭션 흐름에서 기록한다. 결제 Provider는 추상화하여 구현하고,
비즈니스 로직은 Provider에 의존하지 않는다.

End of Document
