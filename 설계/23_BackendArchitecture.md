# 23_BackendArchitecture

**Project:** ASTER\
**Document:** Backend Architecture\
**Version:** 4.0\
**Status:** Draft

------------------------------------------------------------------------

# Purpose

이 문서는 ASTER 백엔드의 기술 구조, 모듈 경계, 요청 처리 흐름, 비동기
작업, 오류 처리, 보안, 로깅, 테스트 기준을 정의한다.

모든 서버 구현은 본 문서와 `04_DomainArchitecture.md`,
`21_PRD_APIContract.md`, `22_DatabaseArchitecture.md`를 함께 따른다.

------------------------------------------------------------------------

# Recommended Stack

## Runtime

-   Node.js LTS
-   TypeScript Strict Mode

## Framework

MVP 권장:

-   Next.js App Router
-   Route Handlers
-   Server Actions는 내부 UI 작업에 제한적으로 사용

확장 단계:

-   필요 시 NestJS 또는 별도 API 서비스로 분리 가능

## Data

-   PostgreSQL
-   Prisma ORM
-   Redis
-   Object Storage

## Validation

-   Zod

## Queue

-   BullMQ 또는 동급 Redis 기반 Queue

## Logging

-   구조화 JSON Logger
-   Request ID 기반 추적

## API Documentation

-   OpenAPI 또는 Swagger 생성 가능 구조

------------------------------------------------------------------------

# Architectural Style

ASTER 백엔드는 다음 구조를 따른다.

``` text
Presentation
    ↓
Application
    ↓
Domain
    ↓
Infrastructure
```

## Presentation Layer

책임:

-   HTTP Request 수신
-   인증 정보 추출
-   입력값 검증
-   Response 변환

금지:

-   비즈니스 로직 직접 구현
-   DB 직접 호출
-   외부 AI Provider 직접 호출

------------------------------------------------------------------------

## Application Layer

책임:

-   Use Case 실행
-   Transaction 경계 관리
-   Domain Service 조합
-   권한 검증
-   Event 발행

예시:

-   CreateProjectUseCase
-   CompleteBrandInterviewUseCase
-   GenerateBrandStrategyUseCase
-   CreateConceptGenerationUseCase

------------------------------------------------------------------------

## Domain Layer

책임:

-   핵심 비즈니스 규칙
-   Entity
-   Value Object
-   Domain Service
-   Repository Interface
-   Domain Event

특정 Framework나 Provider에 의존하지 않는다.

------------------------------------------------------------------------

## Infrastructure Layer

책임:

-   Prisma Repository 구현
-   Redis
-   Queue
-   Object Storage
-   Billing Provider
-   AI Model Adapter
-   Email Provider

------------------------------------------------------------------------

# Backend Module Structure

``` text
src/
├── app/
│   └── api/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── projects/
│   ├── interviews/
│   ├── brand-briefs/
│   ├── brand-strategies/
│   ├── styles/
│   ├── prompts/
│   ├── generations/
│   ├── edits/
│   ├── concept-boards/
│   ├── mockups/
│   ├── subscriptions/
│   ├── design-memory/
│   └── admin/
├── shared/
│   ├── auth/
│   ├── database/
│   ├── errors/
│   ├── events/
│   ├── logging/
│   ├── queue/
│   ├── storage/
│   ├── validation/
│   └── utils/
└── tests/
```

각 모듈은 다음 내부 구조를 권장한다.

``` text
module/
├── application/
├── domain/
├── infrastructure/
├── presentation/
├── schemas/
├── types/
└── tests/
```

------------------------------------------------------------------------

# Request Flow

``` text
Client Request
→ Route Handler
→ Authentication
→ Validation
→ Use Case
→ Domain Rules
→ Repository / Provider Adapter
→ Domain Event
→ Response Mapper
→ API Response
```

------------------------------------------------------------------------

# Authentication and Authorization

## Authentication

-   Access Token
-   Refresh Token
-   Secure Cookie
-   HTTPS Only

## Authorization

역할:

-   designer
-   admin

검증 기준:

-   사용자 소유 프로젝트인지 확인
-   관리자 기능은 Admin Role만 허용
-   구독 기능은 서버에서 플랜 검증
-   모든 생성 요청은 잔여 사용량 확인 후 실행

------------------------------------------------------------------------

# Use Case Rules

모든 기능은 Use Case 단위로 구현한다.

예시:

``` ts
interface CreateProjectInput {
  userId: string;
  name: string;
}

interface CreateProjectOutput {
  projectId: string;
  status: "draft";
}
```

Use Case는 다음 책임만 가진다.

1.  입력 검증
2.  권한 확인
3.  Domain Service 호출
4.  Repository 저장
5.  Event 발행
6.  결과 반환

------------------------------------------------------------------------

# Repository Rules

Domain Layer는 Repository Interface만 정의한다.

예시:

``` ts
interface ProjectRepository {
  findByIdForUser(projectId: string, userId: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
  delete(projectId: string, userId: string): Promise<void>;
}
```

Prisma는 Infrastructure Layer에서만 사용한다.

------------------------------------------------------------------------

# Transaction Rules

Transaction이 필요한 작업:

-   프로젝트 생성 + 초기 Brand Interview 생성
-   Brand Brief Version 생성 + Current Version 변경
-   Strategy Version 생성 + 승인 상태 변경
-   Generation 저장 + Usage Log 기록
-   결제 상태 변경 + Subscription 갱신

긴 AI 호출은 DB Transaction 내부에서 실행하지 않는다.

권장 흐름:

``` text
Request 저장
→ Transaction 종료
→ Queue 발행
→ AI 작업 실행
→ 결과 저장
```

------------------------------------------------------------------------

# Async Job Architecture

비동기 처리 대상:

-   이미지 생성
-   원클릭 수정
-   목업 렌더링
-   PDF Export
-   이메일 발송
-   장시간 AI 분석

Queue 예시:

``` text
brand-analysis
image-generation
image-edit
mockup-render
concept-board-export
email
```

Job 상태:

-   queued
-   processing
-   completed
-   failed
-   canceled

------------------------------------------------------------------------

# AI Provider Architecture

모든 AI Provider는 Adapter를 사용한다.

``` ts
interface ImageGenerationProvider {
  generate(input: GenerationProviderInput): Promise<GenerationProviderResult>;
  edit(input: EditProviderInput): Promise<GenerationProviderResult>;
}
```

금지:

-   Route Handler에서 Provider SDK 직접 호출
-   Prompt Engine 외부에서 프롬프트 임의 조합
-   Provider 응답을 검증 없이 DB에 저장

------------------------------------------------------------------------

# File Storage Rules

Object Storage에 저장:

-   생성 이미지
-   썸네일
-   목업 이미지
-   Concept Board Export
-   PDF
-   사용자 업로드 파일

DB에는 다음만 저장:

-   파일 URL
-   Storage Key
-   MIME Type
-   파일 크기
-   Hash
-   생성자
-   생성 시각

Private Asset은 Signed URL을 사용한다.

------------------------------------------------------------------------

# API Response Rules

모든 API는 `21_PRD_APIContract.md`를 따른다.

성공 예시:

``` json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-07-13T00:00:00.000Z"
  }
}
```

------------------------------------------------------------------------

# Error Architecture

공통 Error 구조:

``` ts
interface AppError {
  code: string;
  message: string;
  httpStatus: number;
  details?: unknown;
  isOperational: boolean;
}
```

분류:

-   ValidationError
-   AuthenticationError
-   AuthorizationError
-   NotFoundError
-   ConflictError
-   UsageLimitError
-   ProviderError
-   InternalError

사용자에게 내부 Stack Trace를 노출하지 않는다.

------------------------------------------------------------------------

# Idempotency

다음 요청은 Idempotency Key를 지원한다.

-   결제 Webhook
-   이미지 생성
-   목업 생성
-   Export
-   구독 변경

중복 요청은 같은 결과를 반환하거나 안전하게 무시한다.

------------------------------------------------------------------------

# Rate Limiting

적용 대상:

-   로그인
-   비밀번호 초기화
-   AI 생성
-   Export
-   공개 Share Link

Rate Limit은 사용자 ID와 IP를 함께 고려한다.

------------------------------------------------------------------------

# Caching Strategy

캐시 대상:

-   Style Library
-   요금제 정보
-   사용자 사용량 요약
-   동일 Prompt Hash 결과
-   Dashboard 요약 정보

캐시 무효화는 Event 기반을 우선한다.

------------------------------------------------------------------------

# Events

주요 Domain Event:

``` text
USER_REGISTERED
PROJECT_CREATED
INTERVIEW_COMPLETED
BRAND_BRIEF_UPDATED
STRATEGY_APPROVED
STYLE_SELECTED
GENERATION_REQUESTED
GENERATION_COMPLETED
EDIT_COMPLETED
CONCEPT_BOARD_CREATED
MOCKUP_RENDERED
SUBSCRIPTION_CHANGED
USAGE_RECORDED
```

------------------------------------------------------------------------

# Observability

모든 요청은 Request ID를 가진다.

로그 항목:

-   requestId
-   userId
-   projectId
-   route
-   duration
-   status
-   errorCode
-   provider
-   model
-   cost
-   tokenUsage
-   timestamp

모니터링 대상:

-   API 오류율
-   AI Provider 실패율
-   Queue 지연
-   생성 평균 시간
-   사용자당 원가
-   결제 Webhook 실패

------------------------------------------------------------------------

# Security Requirements

-   환경변수 검증
-   Secret 코드 저장 금지
-   SQL Injection 방지
-   XSS 방지
-   CSRF 보호
-   File Upload MIME 검증
-   Signed URL
-   관리자 Audit Log
-   개인정보 최소 수집

------------------------------------------------------------------------

# Performance Requirements

-   일반 API 응답 목표: 500ms 이하
-   Dashboard API 목표: 2초 이하
-   AI 요청은 비동기 처리
-   대용량 목록은 Pagination
-   N+1 Query 방지
-   이미지 썸네일 사용

------------------------------------------------------------------------

# Testing Strategy

## Unit Test

-   Domain Service
-   Value Object
-   Use Case
-   Validation

## Integration Test

-   Repository
-   API
-   Queue
-   Billing Webhook
-   Provider Adapter Mock

## End-to-End Test

-   회원가입
-   프로젝트 생성
-   인터뷰 완료
-   Brand Brief 생성
-   이미지 생성 요청
-   구독 한도 처리

------------------------------------------------------------------------

# Environment Separation

환경:

-   local
-   test
-   staging
-   production

각 환경은 독립 DB와 Storage를 사용한다.

Production Key를 Local에서 사용하지 않는다.

------------------------------------------------------------------------

# Deployment Requirements

-   Migration 자동화
-   Health Check Endpoint
-   Readiness Check
-   Graceful Shutdown
-   Rollback 가능 구조
-   Background Worker 독립 실행 가능

Health Endpoint:

``` text
GET /health
GET /health/ready
```

------------------------------------------------------------------------

# Acceptance Criteria

-   모듈별 책임이 분리되어 있다.
-   Route Handler에 비즈니스 로직이 없다.
-   AI Provider가 Adapter 뒤에 있다.
-   생성 요청이 Queue 기반으로 처리된다.
-   모든 사용자 데이터 접근에 소유권 검사가 적용된다.
-   공통 Error와 API Response 형식이 적용된다.
-   Unit, Integration, E2E Test 구조가 존재한다.

------------------------------------------------------------------------

# Definition of Done

-   백엔드 폴더 구조 생성
-   공통 Error 시스템 구현
-   API Response Helper 구현
-   Authentication Middleware 구현
-   Repository Interface 및 Prisma 구현
-   Queue 기본 구조 구현
-   Logger 및 Request ID 구현
-   Health Check 구현
-   기본 테스트 환경 구현
-   문서 업데이트

------------------------------------------------------------------------

# Claude Code Instructions

1.  `00_Vision.md`부터 `22_DatabaseArchitecture.md`까지 먼저 읽는다.
2.  본 문서의 Layer 경계를 위반하지 않는다.
3.  Route Handler에서 Prisma나 AI Provider를 직접 호출하지 않는다.
4.  모든 기능은 Use Case 단위로 구현한다.
5.  생성·편집·목업·Export는 Queue 기반으로 구현한다.
6.  사용자 소유 데이터는 반드시 userId로 제한한다.
7.  기능 구현과 함께 Unit 및 Integration Test를 작성한다.
8.  임의의 Framework나 Provider를 추가하지 않는다.
9.  변경이 필요하면 먼저 관련 문서를 수정한다.

End of Document
