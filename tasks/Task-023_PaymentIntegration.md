# Task-023_PaymentIntegration

**Project:** ASTER **Task ID:** TASK-023 **Title:** Payment Integration
**Priority:** P2 **Estimated Effort:** 8\~10 hours

------------------------------------------------------------------------

# Objective

ASTER의 유료 플랜(Pro / Studio)을 위한 결제 및 구독 관리 기능을
구현한다.

결제 Provider를 추상화하여 특정 PG에 종속되지 않는 구조를 설계한다.

------------------------------------------------------------------------

# Related Documents

-   19_PRD_Subscription.md
-   21_PRD_APIContract.md
-   23_BackendArchitecture.md
-   25_AIProviderArchitecture.md
-   29_SecurityArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

사용자로서 안전하게 구독을 결제하고 플랜을 변경하거나 취소하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - 구독 결제 - 플랜 변경 - 구독 취소 - 결제 내역 조회 - Webhook
처리 - 결제 실패 처리

제외 - 환불 자동화 - 쿠폰 시스템 - 세금계산서 발행

------------------------------------------------------------------------

# Functional Requirements

-   Provider 추상화
-   Webhook 검증
-   결제 성공 시 플랜 변경
-   결제 실패 알림
-   영수증 정보 저장
-   중복 결제 방지

------------------------------------------------------------------------

# Workflow

User → Checkout → Payment Provider → Webhook → Subscription Update →
Notification

------------------------------------------------------------------------

# Backend Tasks

-   CheckoutUseCase
-   SubscriptionUpdateUseCase
-   PaymentWebhookHandler
-   ReceiptService
-   BillingHistoryService

------------------------------------------------------------------------

# Frontend Tasks

-   Pricing Page
-   Checkout Dialog
-   Billing History
-   Payment Status
-   Subscription Management

------------------------------------------------------------------------

# API

POST /billing/checkout

POST /billing/webhook

GET /billing/history

PATCH /billing/subscription

------------------------------------------------------------------------

# Database

-   subscriptions
-   billing_history
-   payment_events
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   결제 성공
-   플랜 변경
-   Webhook 검증
-   결제 내역 조회
-   실패 처리

------------------------------------------------------------------------

# Test Checklist

-   정상 결제
-   중복 결제
-   실패 결제
-   Webhook 위조
-   플랜 변경
-   권한 검증

------------------------------------------------------------------------

# Definition of Done

-   결제 연동 구현
-   Webhook 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

결제 Provider는 Adapter Pattern으로 구현한다. Webhook은 서명을 검증한 뒤
처리한다. 결제 성공 여부는 Webhook을 기준으로 최종 확정한다. 비즈니스
로직은 Provider SDK에 의존하지 않는다.

End of Document
