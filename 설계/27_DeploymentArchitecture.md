# 27_DeploymentArchitecture

**Project:** ASTER **Document:** Deployment Architecture **Version:**
4.0 **Status:** Draft

------------------------------------------------------------------------

# Purpose

본 문서는 ASTER의 배포, 운영, 모니터링, 복구 전략을 정의한다.

------------------------------------------------------------------------

# Environment Strategy

-   local
-   development
-   staging
-   production

각 환경은 독립적인 Database, Storage, Secret을 사용한다.

------------------------------------------------------------------------

# Infrastructure

## Frontend

-   Next.js

## Backend

-   Node.js API
-   Worker

## Database

-   PostgreSQL

## Cache / Queue

-   Redis

## Storage

-   S3 호환 Object Storage

------------------------------------------------------------------------

# Container Strategy

모든 서비스는 Docker 기반으로 실행한다.

Containers

-   web
-   api
-   worker
-   postgres
-   redis

------------------------------------------------------------------------

# CI/CD Pipeline

Git Push → Lint → Type Check → Unit Test → Build → Integration Test →
Deploy Staging → Approval → Deploy Production

------------------------------------------------------------------------

# Deployment Rules

-   Zero Downtime 우선
-   Migration 자동 실행
-   Health Check 통과 후 트래픽 전환
-   Rollback 가능 구조 유지

------------------------------------------------------------------------

# Secrets Management

-   API Keys
-   JWT Secret
-   Database URL
-   Payment Secret
-   AI Provider Keys

코드 저장소에 포함하지 않는다.

------------------------------------------------------------------------

# Monitoring

수집 항목

-   CPU
-   Memory
-   Queue Length
-   API Latency
-   Error Rate
-   AI Provider Success Rate
-   Cost Per Request

------------------------------------------------------------------------

# Logging

모든 로그는 Request ID 기반으로 연결한다.

------------------------------------------------------------------------

# Backup Policy

-   Database Daily Backup
-   Object Storage Versioning
-   Migration 백업
-   30일 보관

------------------------------------------------------------------------

# Disaster Recovery

장애 발생 시

1.  Health Check 감지
2.  Alert 발송
3.  자동 복구 시도
4.  필요 시 Rollback

------------------------------------------------------------------------

# Acceptance Criteria

-   환경 분리
-   Docker 실행 가능
-   CI/CD 구축
-   자동 Rollback 지원
-   Backup 정책 적용

------------------------------------------------------------------------

# Definition of Done

-   Docker 구성
-   CI/CD 설정
-   Monitoring 구성
-   Backup 정책 적용
-   운영 문서 작성

------------------------------------------------------------------------

# Claude Code Instructions

1.  Docker 기반으로 개발 환경을 구성한다.
2.  환경변수는 Secret Manager를 사용한다.
3.  운영 배포는 Health Check 이후 진행한다.
4.  Rollback 가능한 배포 전략을 유지한다.

End of Document
