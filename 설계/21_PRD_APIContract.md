# 21_PRD_APIContract

Project: ASTER Version: 4.0 (AI-Native Specification) Status: Draft

------------------------------------------------------------------------

# Feature ID

ARCH-001

Feature Name

API Contract Standard

Priority

P0

------------------------------------------------------------------------

# Purpose

모든 프론트엔드, 백엔드, AI 엔진은 동일한 API 계약(Contract)을 따른다.

------------------------------------------------------------------------

# Response Standard

``` json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO8601"
  }
}
```

------------------------------------------------------------------------

# Error Standard

``` json
{
  "success": false,
  "data": null,
  "error": {
    "code": "GEN-001",
    "message": "Provider timeout"
  }
}
```

------------------------------------------------------------------------

# Authentication

-   JWT Access Token
-   Refresh Token
-   HTTPS Required

------------------------------------------------------------------------

# Core Endpoints

## Project

POST /projects

GET /projects/{id}

PATCH /projects/{id}

DELETE /projects/{id}

------------------------------------------------------------------------

## Brand

POST /brand/interview

POST /brand/brief

POST /brand/strategy

------------------------------------------------------------------------

## Generation

POST /generation/create

POST /generation/edit

GET /generation/history

------------------------------------------------------------------------

## Concept Board

POST /concept-board/build

GET /concept-board/{id}

------------------------------------------------------------------------

## Subscription

GET /subscription

GET /subscription/usage

POST /subscription/upgrade

------------------------------------------------------------------------

# Event Flow

Create Project → Interview → Brand Brief → Brand Strategy → Style →
Prompt → Generation → Concept Board → Mockup

------------------------------------------------------------------------

# API Versioning

/v1/

Breaking changes는 새로운 버전으로만 배포한다.

------------------------------------------------------------------------

# Rate Limits

Free - 제한적 호출

Pro - 증가된 호출량

Studio - 최고 호출량

------------------------------------------------------------------------

# Claude Code Instructions

모든 API는 REST 규칙을 따른다. 응답 형식은 반드시 본 문서를 준수한다.
OpenAPI(Swagger) 생성이 가능하도록 구현한다.

End of Document
