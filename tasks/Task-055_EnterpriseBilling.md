# Task-055_EnterpriseBilling

**Project:** ASTER **Task ID:** TASK-055 **Title:** Enterprise Billing &
License Management **Priority:** P2 **Estimated Effort:** 9\~11 hours

------------------------------------------------------------------------

# Objective

기업 고객을 위한 조직 단위 과금, 라이선스 관리, 사용량 기반 청구 기능을
구축한다.

------------------------------------------------------------------------

# Related Documents

-   Task-017_SubscriptionAndUsage
-   Task-023_PaymentIntegration
-   Task-052_OrganizationManagement
-   Task-054_EnterpriseSecurity
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

조직 관리자로서 라이선스를 효율적으로 배정하고 조직 전체의 사용량과
비용을 관리하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - Organization Billing - License Assignment - Seat Management -
Usage Billing - Invoice History - Billing Alerts

제외 - 회계 시스템 직접 연동 - 국가별 세금 계산

------------------------------------------------------------------------

# Functional Requirements

-   조직 단위 구독
-   Seat 추가/회수
-   사용량 기반 과금
-   청구 내역 조회
-   결제 실패 알림
-   예산 한도 설정

------------------------------------------------------------------------

# Workflow

Organization → Assign Seats → Track Usage → Generate Invoice → Payment →
Billing Report

------------------------------------------------------------------------

# Backend Tasks

-   EnterpriseBillingService
-   LicenseManager
-   UsageBillingEngine
-   InvoiceService
-   BudgetAlertService

------------------------------------------------------------------------

# Frontend Tasks

-   Billing Dashboard
-   License Manager
-   Seat Assignment
-   Invoice Viewer
-   Budget Settings

------------------------------------------------------------------------

# API

GET /enterprise/billing

GET /enterprise/licenses

POST /enterprise/licenses/assign

GET /enterprise/invoices

------------------------------------------------------------------------

# Database

-   enterprise_billing
-   licenses
-   invoices
-   billing_usage
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   라이선스 배정
-   사용량 집계
-   청구서 생성
-   예산 경고
-   결제 이력 조회

------------------------------------------------------------------------

# Test Checklist

-   Seat 추가
-   Seat 회수
-   청구 생성
-   사용량 계산
-   권한 검증

------------------------------------------------------------------------

# Definition of Done

-   Enterprise Billing 구현
-   License 관리 구현
-   Invoice 기능 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

과금은 Organization 단위로 관리한다. Seat 기반 라이선스와 사용량 기반
과금을 모두 지원할 수 있도록 확장 가능하게 설계한다. 모든 청구 이력은
변경 불가능한 기록으로 보관한다.

End of Document
