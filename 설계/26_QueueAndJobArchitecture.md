# 26_QueueAndJobArchitecture

**Project:** ASTER **Document:** Queue & Job Architecture **Version:**
4.0 **Status:** Draft

------------------------------------------------------------------------

# Purpose

ASTER는 시간이 오래 걸리는 작업을 비동기로 처리하여 빠른 사용자 경험과
안정적인 서버 운영을 제공한다.

------------------------------------------------------------------------

# Objectives

-   긴 작업의 비동기 처리
-   재시도 가능한 Job 구조
-   우선순위 기반 Queue
-   장애 복구
-   비용 및 처리시간 추적

------------------------------------------------------------------------

# Technology

-   Redis
-   BullMQ (권장)
-   Worker Process 분리

------------------------------------------------------------------------

# Queue Topology

``` text
API Request
    ↓
Job Queue
    ↓
Worker
    ↓
AI Provider / Export / Storage
    ↓
Database Update
    ↓
User Notification
```

------------------------------------------------------------------------

# Queues

## High Priority

-   image-generation-pro
-   payment-webhook

## Standard

-   brand-analysis
-   image-generation
-   image-edit
-   concept-board

## Low Priority

-   mockup-render
-   pdf-export
-   email
-   cleanup

------------------------------------------------------------------------

# Job Lifecycle

Queued → Waiting → Processing → Completed

실패 시

Processing → Failed → Retry → Dead Letter Queue

------------------------------------------------------------------------

# Retry Policy

-   최대 3회 재시도
-   Exponential Backoff
-   Provider Timeout 시 자동 Failover 고려

------------------------------------------------------------------------

# Dead Letter Queue

다음 조건에서 이동

-   재시도 초과
-   복구 불가능 오류
-   잘못된 입력

관리자는 재실행 가능해야 한다.

------------------------------------------------------------------------

# Worker Rules

-   Worker는 Stateless
-   Job은 Idempotent
-   하나의 Job은 하나의 책임만 수행

------------------------------------------------------------------------

# Progress Tracking

모든 Job은 진행 상태를 저장한다.

-   queued
-   processing
-   completed
-   failed
-   canceled

------------------------------------------------------------------------

# Notifications

완료 시

-   Dashboard 갱신
-   실시간 이벤트(WebSocket/SSE 확장 가능)
-   이메일(선택)

------------------------------------------------------------------------

# Monitoring Metrics

-   Queue Length
-   Processing Time
-   Failure Rate
-   Retry Count
-   Cost Per Job
-   Provider Used

------------------------------------------------------------------------

# API

POST /jobs/{type} GET /jobs/{id} POST /jobs/{id}/retry DELETE /jobs/{id}

------------------------------------------------------------------------

# Database

job_logs job_failures queue_metrics

------------------------------------------------------------------------

# Security

-   사용자 소유 Job만 조회 가능
-   내부 Queue는 외부 접근 차단
-   Job Payload 최소화

------------------------------------------------------------------------

# Acceptance Criteria

-   비동기 처리 동작
-   재시도 정책 적용
-   Dead Letter Queue 동작
-   진행 상태 조회 가능
-   모니터링 데이터 기록

------------------------------------------------------------------------

# Definition of Done

-   Queue 구현
-   Worker 구현
-   Retry 구현
-   모니터링 구현
-   테스트 완료

------------------------------------------------------------------------

# Claude Code Instructions

1.  모든 장시간 작업은 Queue를 사용한다.
2.  Worker는 API 서버와 독립적으로 실행 가능해야 한다.
3.  Job은 중복 실행되어도 안전(Idempotent)해야 한다.
4.  실패 원인과 처리 시간을 반드시 기록한다.

End of Document
