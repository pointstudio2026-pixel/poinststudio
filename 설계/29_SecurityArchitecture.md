# 29_SecurityArchitecture

**Project:** ASTER\
**Document:** Security Architecture\
**Version:** 4.0\
**Status:** Draft

------------------------------------------------------------------------

# Purpose

본 문서는 ASTER의 보안 원칙과 인증, 권한, 개인정보 보호, AI 보안 정책을
정의한다.

목표는 사용자 데이터와 브랜드 자산을 안전하게 보호하면서 법적 리스크를
최소화하는 것이다.

------------------------------------------------------------------------

# Security Principles

-   Security by Design
-   Least Privilege
-   Zero Trust
-   Defense in Depth
-   Privacy by Default

------------------------------------------------------------------------

# Authentication

지원 방식

-   Email + Password
-   OAuth (Google 등 확장 가능)

정책

-   JWT Access Token
-   Refresh Token
-   Secure Cookie
-   HTTPS Only
-   Session Rotation

------------------------------------------------------------------------

# Authorization

역할(Role)

-   Designer
-   Admin

규칙

-   모든 프로젝트는 소유자만 접근 가능
-   관리자 기능은 별도 권한 검증
-   서버에서 권한을 최종 검증

------------------------------------------------------------------------

# Data Protection

암호화 대상

-   비밀번호(Hash)
-   API Secret
-   결제 관련 식별자
-   민감 설정값

민감 데이터는 로그에 기록하지 않는다.

------------------------------------------------------------------------

# File Security

-   MIME Type 검증
-   파일 크기 제한
-   악성 파일 검사 구조 고려
-   Signed URL 사용
-   Private Storage 기본

------------------------------------------------------------------------

# API Security

-   Rate Limit
-   Input Validation
-   Zod Schema 검증
-   CSRF 보호
-   CORS 정책
-   Idempotency 지원

------------------------------------------------------------------------

# AI Security

Prompt Injection 대응

-   사용자 입력 정규화
-   시스템 프롬프트 분리
-   안전 규칙 마지막 적용

브랜드 보호

-   특정 브랜드 모방 요청 일반화
-   상표 침해 가능 요청 차단
-   저작권 침해 위험 결과 제한

------------------------------------------------------------------------

# Secret Management

관리 대상

-   AI Provider Key
-   Payment Key
-   JWT Secret
-   Database URL

환경변수 또는 Secret Manager만 사용한다.

------------------------------------------------------------------------

# Audit Logging

기록 대상

-   로그인
-   권한 변경
-   결제
-   관리자 작업
-   프로젝트 삭제
-   Export

로그 항목

-   requestId
-   userId
-   action
-   timestamp
-   result

------------------------------------------------------------------------

# Privacy

-   최소 수집 원칙
-   사용자 데이터 삭제 요청 지원
-   프로젝트별 데이터 분리
-   Design Memory 비활성화 가능

------------------------------------------------------------------------

# Incident Response

1.  이상 탐지
2.  알림
3.  영향 범위 확인
4.  임시 차단
5.  복구
6.  사후 분석

------------------------------------------------------------------------

# Compliance Checklist

-   HTTPS 적용
-   비밀번호 Hash
-   권한 검증
-   감사 로그
-   개인정보 최소 수집
-   데이터 삭제 정책
-   보안 테스트 수행

------------------------------------------------------------------------

# Acceptance Criteria

-   인증 우회 불가
-   권한 우회 불가
-   민감 데이터 암호화
-   Prompt Injection 방어
-   감사 로그 기록

------------------------------------------------------------------------

# Definition of Done

-   인증 구현
-   권한 구현
-   Secret 관리
-   Audit Log 구현
-   보안 테스트 완료

------------------------------------------------------------------------

# Claude Code Instructions

1.  모든 API는 인증 및 권한 검증을 수행한다.
2.  사용자 입력은 검증 후 처리한다.
3.  Secret을 코드에 하드코딩하지 않는다.
4.  Prompt Injection 방어를 Prompt Engine과 함께 적용한다.
5.  민감 정보는 로그와 클라이언트 응답에 포함하지 않는다.

End of Document
