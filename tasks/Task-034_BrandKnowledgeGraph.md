# Task-034_BrandKnowledgeGraph

**Project:** ASTER **Task ID:** TASK-034 **Title:** Brand Knowledge
Graph **Priority:** P2 **Estimated Effort:** 8\~10 hours

------------------------------------------------------------------------

# Objective

브랜드의 미션, 비전, 타깃 고객, 가치, 경쟁 포지셔닝, 스타일, 컬러,
타이포그래피 등의 관계를 그래프 형태로 관리하여 Aster Brain이 더 깊고
일관성 있는 추론을 수행할 수 있도록 구현한다.

------------------------------------------------------------------------

# Related Documents

-   10_PRD_BrandBrief.md
-   11_PRD_BrandStrategy.md
-   13_PRD_AsterBrain.md
-   20_PRD_DesignMemory.md
-   22_DatabaseArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 브랜드의 모든 요소가 서로 어떻게 연결되는지 확인하고, AI가
그 관계를 활용해 더 정교한 제안을 해주길 원한다.

------------------------------------------------------------------------

# Scope

포함 - Brand Entity 관리 - 관계(Relationship) 관리 - Graph Query -
추론용 Context 생성 - Graph Version 관리

제외 - 외부 Knowledge Graph 연동 - 공개 Graph API

------------------------------------------------------------------------

# Functional Requirements

-   Brand Entity 생성
-   Entity 관계 정의
-   Graph 탐색
-   Brand Context 생성
-   Graph 버전 관리
-   변경 이력 기록

------------------------------------------------------------------------

# Graph Model

Brand → Mission → Vision → Core Values → Target Audience → Positioning →
Style → Colors → Typography → Logo Concepts

------------------------------------------------------------------------

# Workflow

Brand Brief → Entity Builder → Relationship Builder → Knowledge Graph →
Context Generator → Aster Brain

------------------------------------------------------------------------

# Backend Tasks

-   KnowledgeGraphUseCase
-   EntityBuilder
-   RelationshipManager
-   ContextGenerator
-   GraphVersionService

------------------------------------------------------------------------

# Frontend Tasks

-   Graph Viewer
-   Entity Inspector
-   Relationship Explorer
-   Context Preview

------------------------------------------------------------------------

# API

POST /knowledge-graph/build

GET /knowledge-graph/{projectId}

GET /knowledge-graph/{projectId}/context

------------------------------------------------------------------------

# Database

-   brand_entities
-   brand_relationships
-   graph_versions
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   그래프 생성
-   관계 조회
-   Context 생성
-   버전 저장
-   변경 이력 기록

------------------------------------------------------------------------

# Test Checklist

-   신규 프로젝트
-   Entity 추가
-   관계 변경
-   Context 생성
-   버전 복원

------------------------------------------------------------------------

# Definition of Done

-   Knowledge Graph 구현
-   Context Generator 구현
-   Graph Viewer 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Knowledge Graph는 ASTER의 내부 추론 구조이다. 브랜드 요소를 그래프로
관리하여 Aster Brain과 Style Engine이 공통으로 활용한다. 그래프 구조는
확장 가능하게 설계하고 모든 변경은 버전 관리한다.

End of Document
