# Task-022_NotificationCenter

**Project:** ASTER **Task ID:** TASK-022 **Title:** Notification Center
**Priority:** P2 **Estimated Effort:** 6\~8 hours

------------------------------------------------------------------------

# Objective

프로젝트 진행 상황, AI 작업 완료, 팀 협업, 구독 상태 등 서비스 전반의
이벤트를 사용자에게 전달하는 통합 Notification Center를 구현한다.

------------------------------------------------------------------------

# Related Documents

-   08_PRD_ProjectWorkspace.md
-   19_PRD_Subscription.md
-   21_PRD_APIContract.md
-   23_BackendArchitecture.md
-   29_SecurityArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 이미지 생성 완료, 팀 초대, 구독 변경 등 중요한 이벤트를
즉시 확인하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - 인앱 알림 - 읽음/안읽음 - 알림 필터 - 알림 설정 - 이벤트 기반
생성

제외 - SMS - 푸시 알림 - 마케팅 캠페인

------------------------------------------------------------------------

# Notification Types

-   Image Generation Complete
-   Export Complete
-   Team Invitation
-   Comment Mention
-   Subscription Update
-   Usage Limit Warning
-   System Notice

------------------------------------------------------------------------

# Functional Requirements

-   알림 생성
-   읽음 처리
-   전체 읽음
-   중요 알림 고정
-   카테고리 필터
-   사용자 설정 반영

------------------------------------------------------------------------

# Workflow

System Event → Notification Service → Store Notification → In-App
Delivery → User Action → Read Status Update

------------------------------------------------------------------------

# Backend Tasks

-   NotificationUseCase
-   NotificationDispatcher
-   PreferenceService
-   ReadStatusService

------------------------------------------------------------------------

# Frontend Tasks

-   Notification Bell
-   Notification Drawer
-   Badge Counter
-   Filter Tabs
-   Settings Screen

------------------------------------------------------------------------

# API

GET /notifications

POST /notifications/read

POST /notifications/read-all

PATCH /notification-settings

------------------------------------------------------------------------

# Database

-   notifications
-   notification_settings
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   알림 생성
-   읽음 처리
-   필터 동작
-   설정 저장
-   Badge 갱신

------------------------------------------------------------------------

# Test Checklist

-   생성 완료 알림
-   팀 초대
-   읽음 처리
-   전체 읽음
-   설정 변경
-   권한 검증

------------------------------------------------------------------------

# Definition of Done

-   Notification Center 구현
-   설정 화면 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Notification은 이벤트 기반으로 생성한다. 비즈니스 로직에서 직접 UI를
호출하지 않는다. 읽음 상태는 사용자별로 관리하며 확장 가능한 Event
구조를 사용한다.

End of Document
