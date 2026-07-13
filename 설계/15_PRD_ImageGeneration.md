# 15_PRD_ImageGeneration

Project: ASTER Version: 3.0 (AI-Native Specification) Status: Draft

------------------------------------------------------------------------

# Feature ID

PRD-010

Feature Name

Image Generation

Priority

P0 (Core Service)

------------------------------------------------------------------------

# Goal

Image Generation은 Brand Brief, Brand Strategy, Style Engine, Prompt
Engine의 결과를 바탕으로 디자이너가 참고할 수 있는 브랜드 컨셉 이미지를
생성한다.

본 기능의 목적은 완성된 로고를 만드는 것이 아니라 디자인 방향성을
시각화하는 것이다.

------------------------------------------------------------------------

# Product Principles

-   결과물은 참고용 컨셉이다.
-   최종 디자인은 디자이너가 제작한다.
-   생성보다 방향성의 일관성을 우선한다.

------------------------------------------------------------------------

# Inputs

-   Approved Brand Brief
-   Approved Brand Strategy
-   Selected Style
-   Prompt Payload
-   Subscription Plan

------------------------------------------------------------------------

# Outputs

-   Concept Images
-   Generation Metadata
-   Generation Version
-   Reasoning Summary

------------------------------------------------------------------------

# Generation Pipeline

Brand Brief → Brand Strategy → Style Engine → Prompt Engine → Model
Router → Safety Filter → Image Generation → Result Storage → One Click
Edit Ready

------------------------------------------------------------------------

# Model Router

모델은 Adapter Pattern으로 연결한다.

지원 대상

-   OpenAI
-   Google Gemini
-   Nano Banana
-   Future Providers

Provider 변경 시 Image Generation 로직은 수정하지 않는다.

------------------------------------------------------------------------

# Subscription Rules

Free - 저해상도 - 일일 생성 제한 - 워터마크(선택)

Pro - 고해상도 - 생성량 증가 - 빠른 대기열

Studio - 최고 생성량 - 우선 처리 - 추가 기능

모든 플랜은 목표 원가율 20% 이하를 유지하도록 설계한다.

------------------------------------------------------------------------

# Queue Management

-   생성 요청 큐
-   우선순위 큐
-   재시도 큐
-   실패 큐

------------------------------------------------------------------------

# Caching

동일 조건의 생성 요청은 캐시를 우선 확인한다.

------------------------------------------------------------------------

# Versioning

Generation V1 → One Click Edit → Generation V2 → Save

모든 생성은 프로젝트 히스토리에 저장한다.

------------------------------------------------------------------------

# API

POST /generation/create

GET /generation/{projectId}

POST /generation/retry

DELETE /generation/{id}

------------------------------------------------------------------------

# Database

generations generation_versions generation_queue generation_logs

------------------------------------------------------------------------

# Error Handling

GEN-001 Provider Timeout

GEN-002 Queue Full

GEN-003 Generation Failed

GEN-004 Safety Blocked

------------------------------------------------------------------------

# Acceptance Criteria

-   이미지 생성 성공
-   생성 이력 저장
-   플랜별 제한 적용
-   Queue 정상 동작
-   One Click Edit 연동

------------------------------------------------------------------------

# Definition of Done

-   Model Router 구현
-   Queue 구현
-   Cache 구현
-   API 테스트
-   문서 업데이트

------------------------------------------------------------------------

# Claude Code Instructions

Image Generation은 Provider에 직접 의존하지 않는다. 반드시 Model
Adapter를 통해 호출한다. 생성 결과는 프로젝트 버전과 연결하여 저장한다.
모든 결과는 '참고용 컨셉'으로 표시할 수 있는 구조를 유지한다.

End of Document
