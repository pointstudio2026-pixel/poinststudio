# 06_PRD_Authentication

Project: ASTER Version: 2.0 (AI-Native Specification) Status: Draft

------------------------------------------------------------------------

# Feature ID

PRD-001

Feature Name

Authentication

Priority

P0 (Critical)

Owner

Platform

------------------------------------------------------------------------

# Goal

사용자가 안전하게 회원가입하고 로그인하여 모든 프로젝트와 구독 정보를
사용할 수 있도록 한다.

------------------------------------------------------------------------

# Actors

Primary - Designer

Secondary - Admin

------------------------------------------------------------------------

# User Stories

US-001 신규 사용자는 이메일 또는 소셜 계정으로 가입할 수 있다.

US-002 기존 사용자는 로그인 후 Dashboard로 이동한다.

US-003 인증되지 않은 사용자는 프로젝트에 접근할 수 없다.

------------------------------------------------------------------------

# Screens

AUTH-01 Login

AUTH-02 Sign Up

AUTH-03 Forgot Password

AUTH-04 Reset Password

AUTH-05 Verify Email

------------------------------------------------------------------------

# Components

-   Email Input
-   Password Input
-   Remember Me
-   Continue Button
-   Google Login
-   GitHub Login (optional)
-   Error Banner
-   Loading Spinner

------------------------------------------------------------------------

# State Machine

Idle → Validating → Authenticating → Success → Dashboard

Failure → Error Message → Retry

------------------------------------------------------------------------

# Validation Rules

Email - Required - RFC compliant

Password - Minimum 8 characters - At least one letter - At least one
number

------------------------------------------------------------------------

# Business Rules

-   이메일 인증 완료 후 서비스 이용
-   JWT 기반 인증
-   Refresh Token 사용
-   로그인 상태 유지 옵션 제공

------------------------------------------------------------------------

# API

POST /auth/signup

POST /auth/login

POST /auth/logout

POST /auth/refresh

POST /auth/forgot-password

POST /auth/reset-password

------------------------------------------------------------------------

# Database

users

sessions

email_verifications

password_resets

------------------------------------------------------------------------

# Security

-   Password Hash (Argon2 또는 bcrypt)
-   HTTPS only
-   CSRF protection
-   Rate Limiting
-   MFA 확장 가능 구조

------------------------------------------------------------------------

# Error Handling

AUTH-001 Invalid Email

AUTH-002 Wrong Password

AUTH-003 Email Not Verified

AUTH-004 Too Many Attempts

AUTH-005 Server Error

------------------------------------------------------------------------

# Acceptance Criteria

-   신규 회원가입 성공
-   로그인 성공 시 Dashboard 이동
-   실패 시 명확한 오류 표시
-   세션 유지 동작 확인

------------------------------------------------------------------------

# Definition of Done

-   Frontend 완료
-   Backend 완료
-   API 테스트 완료
-   DB Migration 완료
-   문서 업데이트 완료

------------------------------------------------------------------------

# Claude Code Instructions

반드시 00_Vision.md \~ 05_PRD_Index.md를 먼저 읽는다. TypeScript
Strict를 사용한다. 문서에 없는 기능은 추가하지 않는다. 모든 API와 UI
테스트를 작성한다.

End of Document
