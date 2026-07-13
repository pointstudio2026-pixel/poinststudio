# 28_TestingStrategy

**Project:** ASTER **Document:** Testing Strategy **Version:** 4.0
**Status:** Draft

------------------------------------------------------------------------

# Purpose

본 문서는 ASTER의 테스트 원칙과 품질 기준을 정의한다.

목표는 기능 구현뿐 아니라 AI 기반 기능까지 지속적으로 검증 가능한 구조를
만드는 것이다.

------------------------------------------------------------------------

# Testing Pyramid

-   Unit Test
-   Integration Test
-   End-to-End Test
-   AI Validation Test
-   Performance Test

------------------------------------------------------------------------

# Quality Principles

-   테스트 가능한 설계
-   작은 단위부터 검증
-   회귀 방지
-   자동화 우선
-   사람이 최종 품질 검토

------------------------------------------------------------------------

# Unit Test

대상

-   Domain Service
-   Use Case
-   Validation
-   Utility
-   Prompt Builder
-   Style Rules

목표 커버리지

80% 이상

------------------------------------------------------------------------

# Integration Test

대상

-   Database
-   Repository
-   Queue
-   API
-   AI Adapter(Mock)
-   Billing

검증

-   Transaction
-   Event
-   Versioning
-   Authorization

------------------------------------------------------------------------

# End-to-End Test

핵심 시나리오

1.  회원가입
2.  로그인
3.  프로젝트 생성
4.  Brand Interview 완료
5.  Brand Brief 생성
6.  Brand Strategy 승인
7.  Style 선택
8.  이미지 생성
9.  Concept Board 생성
10. Export

------------------------------------------------------------------------

# AI Validation

검증 항목

-   JSON Schema 준수
-   Brand Brief 일관성
-   Strategy 생성
-   Prompt 생성
-   Safety Filter
-   Provider Failover

------------------------------------------------------------------------

# Performance Test

목표

-   일반 API \< 500ms
-   Dashboard \< 2초
-   Queue 처리 지연 최소화

부하 테스트

-   동시 생성 요청
-   동시 로그인
-   대량 Export

------------------------------------------------------------------------

# Security Test

-   인증 우회
-   권한 검증
-   Rate Limit
-   업로드 파일 검증
-   SQL Injection
-   XSS
-   CSRF

------------------------------------------------------------------------

# Regression Policy

모든 PR Merge 시

-   Unit Test
-   Integration Test
-   Lint
-   Type Check

실행

Release 전

-   E2E
-   성능 테스트

------------------------------------------------------------------------

# Test Data

-   Seed Database
-   Mock Provider
-   Fixture 기반 테스트
-   테스트 데이터 자동 초기화

------------------------------------------------------------------------

# CI Pipeline

Commit → Lint → Type Check → Unit Test → Integration Test → Build

Release

→ E2E → Performance → Deploy

------------------------------------------------------------------------

# Acceptance Criteria

-   핵심 기능 테스트 자동화
-   AI Adapter Mock 지원
-   회귀 테스트 통과
-   성능 기준 충족

------------------------------------------------------------------------

# Definition of Done

-   테스트 환경 구축
-   Mock 작성
-   CI 연동
-   커버리지 리포트
-   테스트 문서 작성

------------------------------------------------------------------------

# Claude Code Instructions

1.  새로운 기능에는 반드시 Unit Test를 작성한다.
2.  API 추가 시 Integration Test를 함께 작성한다.
3.  AI Provider는 Mock으로 테스트한다.
4.  테스트 실패 시 구현을 완료로 간주하지 않는다.

End of Document
