# Task-052_OrganizationManagement

**Project:** ASTER **Task ID:** TASK-052 **Title:** Organization
Management **Priority:** P2 **Estimated Effort:** 9\~11 hours

------------------------------------------------------------------------

# Objective

기업 고객과 디자인 에이전시를 위한 Organization(조직) 관리 기능을
구축하여 여러 팀과 프로젝트를 하나의 조직 단위에서 관리할 수 있도록
한다.

------------------------------------------------------------------------

# Related Documents

-   Task-021_TeamWorkspace
-   Task-020_AdminDashboard
-   Task-023_PaymentIntegration
-   22_DatabaseArchitecture.md
-   29_SecurityArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

조직 관리자로서 여러 팀원과 프로젝트를 하나의 워크스페이스에서 관리하고
권한을 효율적으로 제어하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - Organization 생성 - Workspace 관리 - 팀 관리 - 부서 관리 -
역할(Role) 관리 - 초대 및 멤버 관리

제외 - SSO - SCIM Provisioning

------------------------------------------------------------------------

# Functional Requirements

-   조직 생성/수정
-   Workspace 생성
-   부서 관리
-   역할 기반 권한(RBAC)
-   멤버 초대/제거
-   조직별 사용량 조회

------------------------------------------------------------------------

# Workflow

Create Organization → Create Workspace → Invite Members → Assign Roles →
Manage Projects → Review Usage

------------------------------------------------------------------------

# Backend Tasks

-   OrganizationService
-   WorkspaceService
-   RoleService
-   MemberInvitationService
-   UsageSummaryService

------------------------------------------------------------------------

# Frontend Tasks

-   Organization Settings
-   Workspace Switcher
-   Member Management
-   Role Editor
-   Department Manager

------------------------------------------------------------------------

# API

POST /organizations GET /organizations GET
/organizations/{organizationId} PATCH /organizations/{organizationId}
POST /organizations/{organizationId}/members

------------------------------------------------------------------------

# Database

-   organizations
-   workspaces
-   organization_members
-   departments
-   roles
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   조직 생성
-   멤버 초대
-   역할 적용
-   Workspace 전환
-   사용량 조회

------------------------------------------------------------------------

# Test Checklist

-   조직 생성
-   멤버 초대
-   권한 변경
-   Workspace 전환
-   조직 삭제
-   권한 검증

------------------------------------------------------------------------

# Definition of Done

-   Organization 기능 구현
-   Workspace 관리 구현
-   RBAC 적용
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Organization은 Team보다 상위 개념으로 설계한다. 모든 권한은
Organization과 Workspace 범위를 고려하여 검사한다. 조직 데이터는
논리적으로 격리(Tenant Isolation)하고 감사 로그를 남긴다.

End of Document
