# 18_PRD_MockupStudio

Project: ASTER Version: 3.0 (AI-Native Specification) Status: Draft

------------------------------------------------------------------------

# Feature ID

PRD-013

Feature Name

Mockup Studio

Priority

P1 (Presentation)

------------------------------------------------------------------------

# Goal

Mockup Studio는 생성된 브랜드 컨셉을 다양한 실제 적용 예시에 배치하여
디자이너와 고객이 브랜드 방향성을 쉽게 검토할 수 있도록 한다.

목업은 참고용 프레젠테이션 자료이며 최종 제작물을 의미하지 않는다.

------------------------------------------------------------------------

# Inputs

-   Approved Brand Brief
-   Approved Brand Strategy
-   Selected Concept Images
-   Concept Board
-   Selected Mockup Templates

------------------------------------------------------------------------

# Outputs

-   Mockup Set
-   Presentation Images
-   PDF Presentation
-   PNG Export

------------------------------------------------------------------------

# Supported Mockups

## Print

-   Business Card
-   Letterhead
-   Envelope
-   Brochure

## Signage

-   Outdoor Sign
-   Indoor Sign
-   Window Graphic

## Packaging

-   Box
-   Paper Bag
-   Bottle
-   Cup

## Digital

-   Website Hero
-   Mobile App
-   Social Profile
-   Social Post

------------------------------------------------------------------------

# Workflow

Concept Selection → Mockup Template Selection → Asset Placement →
Preview → Export

------------------------------------------------------------------------

# Business Rules

-   원본 컨셉 이미지는 변경하지 않는다.
-   목업은 프로젝트 버전과 연결된다.
-   사용자는 여러 목업을 하나의 세트로 저장할 수 있다.

------------------------------------------------------------------------

# UI Components

-   Template Gallery
-   Preview Canvas
-   Mockup Grid
-   Export Panel
-   Favorite Templates

------------------------------------------------------------------------

# API

GET /mockups/templates POST /mockups/render GET /mockups/{projectId}
POST /mockups/export

------------------------------------------------------------------------

# Database

mockup_templates mockup_projects mockup_versions

------------------------------------------------------------------------

# Error Handling

MOCK-001 Template Missing MOCK-002 Render Failed MOCK-003 Export Failed

------------------------------------------------------------------------

# Acceptance Criteria

-   템플릿 선택 가능
-   목업 생성 성공
-   PDF/PNG Export 가능
-   프로젝트와 버전 연결

------------------------------------------------------------------------

# Definition of Done

-   UI 구현
-   API 구현
-   Export 구현
-   테스트 완료
-   문서 업데이트

------------------------------------------------------------------------

# Claude Code Instructions

Mockup Studio는 편집기가 아니라 프레젠테이션 도구이다. 템플릿은 데이터
기반으로 관리하며 새로운 템플릿을 쉽게 추가할 수 있는 구조로 구현한다.

End of Document
