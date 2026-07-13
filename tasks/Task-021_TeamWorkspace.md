# Task-021_TeamWorkspace

**Project:** ASTER **Task ID:** TASK-021 **Title:** Team Workspace &
Collaboration **Priority:** P2 **Estimated Effort:** 8\~10 hours

------------------------------------------------------------------------

# Objective

여러 디자이너가 하나의 브랜드 프로젝트를 함께 작업할 수 있는 협업 기능을
구현한다.

MVP에서는 확장 가능한 구조를 우선 설계하며, 향후 Studio 플랜의 핵심
기능으로 활용한다.

------------------------------------------------------------------------

# Related Documents

-   08_PRD_ProjectWorkspace.md
-   19_PRD_Subscription.md
-   22_DatabaseArchitecture.md
-   23_BackendArchitecture.md
-   29_SecurityArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

팀 디자이너로서 프로젝트를 공유하고 역할에 맞는 권한으로 함께 작업하고
싶다.

------------------------------------------------------------------------

# Scope

포함 - 팀 생성 - 팀원 초대 - 역할(Role) 관리 - 프로젝트 공유 - 댓글 -
활동 기록

제외 - 실시간 동시 편집 - 음성/영상 회의

------------------------------------------------------------------------

# Roles

-   Owner
-   Admin
-   Designer
-   Viewer

------------------------------------------------------------------------

# Functional Requirements

-   이메일 기반 초대
-   역할별 권한 제어
-   프로젝트 공유
-   댓글 작성/수정
-   활동 타임라인
-   팀 탈퇴 및 제거

------------------------------------------------------------------------

# Workflow

Create Team → Invite Member → Accept Invitation → Share Project →
Collaborate → Activity Log

------------------------------------------------------------------------

# Backend Tasks

-   TeamUseCase
-   InvitationService
-   PermissionService
-   CommentService
-   ActivityService

------------------------------------------------------------------------

# Frontend Tasks

-   Team Settings
-   Member List
-   Invite Dialog
-   Comment Panel
-   Activity Timeline

------------------------------------------------------------------------

# API

POST /teams POST /teams/invitations POST /teams/projects/share GET
/teams/{teamId} GET /projects/{projectId}/comments

------------------------------------------------------------------------

# Database

-   teams
-   team_members
-   project_permissions
-   comments
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   팀 생성 성공
-   초대 및 참여 성공
-   권한 제어 정상
-   댓글 기능 동작
-   활동 기록 저장

------------------------------------------------------------------------

# Test Checklist

-   Owner 권한
-   Designer 권한
-   Viewer 권한
-   초대 만료
-   권한 없는 접근
-   댓글 CRUD

------------------------------------------------------------------------

# Definition of Done

-   팀 기능 구현
-   권한 시스템 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

협업 기능은 Role-Based Access Control(RBAC)을 사용한다. 모든 변경 사항은
Activity Log에 기록한다. 실시간 기능을 고려한 확장 가능한 구조로
구현하되 MVP에서는 비실시간 협업을 지원한다.

End of Document
