# 12_PRD_StyleEngine

Project: ASTER Version: 3.0 (AI-Native Specification) Status: Draft

------------------------------------------------------------------------

# Feature ID

PRD-007

Feature Name

Style Engine

Priority

P0 (Core Competitive Advantage)

------------------------------------------------------------------------

# Goal

Style Engine는 Brand Strategy를 기반으로 가장 적합한 디자인 스타일을
추천한다.

이미지를 생성하기 전에 시각적 방향성을 먼저 결정한다.

------------------------------------------------------------------------

# Inputs

-   Approved Brand Strategy
-   Latest Brand Brief
-   Industry
-   Design Memory
-   Style Library

------------------------------------------------------------------------

# Outputs

-   Recommended Style Set
-   Primary Style
-   Secondary Style
-   Style Explanation
-   Color Direction
-   Typography Direction
-   Symbol Direction

------------------------------------------------------------------------

# Style Taxonomy

## Level 1 (10)

-   Modern
-   Classic
-   Luxury
-   Minimal
-   Organic
-   Tech
-   Heritage
-   Playful
-   Premium
-   Experimental

## Level 2

각 대분류는 5\~10개의 중분류를 가진다.

예시

Modern - Swiss - Geometric - Contemporary - Corporate - Futuristic

## Level 3

최종적으로 약 150개의 스타일 카테고리를 제공한다.

------------------------------------------------------------------------

# Recommendation Rules

1.  Brand Strategy를 최우선으로 사용
2.  Brand Brief와 일치 여부 확인
3.  업종 특성 반영
4.  Design Memory 반영
5.  충돌 규칙 검사
6.  추천 결과 생성

------------------------------------------------------------------------

# Style Combination Rules

-   Primary Style : 1개
-   Secondary Style : 최대 2개
-   충돌하는 스타일은 함께 추천하지 않는다.

예시

허용 - Swiss + Minimal - Luxury + Serif

비허용 - Ultra Minimal + Maximalism

------------------------------------------------------------------------

# Explanation

모든 추천에는 다음 항목이 포함된다.

-   추천 이유
-   기대 효과
-   주의 사항

------------------------------------------------------------------------

# UI Components

-   Category Tree
-   Style Cards
-   Search
-   Favorites
-   Compare
-   Preview

------------------------------------------------------------------------

# API

GET /styles

POST /styles/recommend

POST /styles/select

GET /styles/categories

------------------------------------------------------------------------

# Database

styles style_categories style_relations style_rules
user_style_preferences

------------------------------------------------------------------------

# Error Handling

STYLE-001 No Recommendation

STYLE-002 Invalid Combination

STYLE-003 Style Not Found

------------------------------------------------------------------------

# Acceptance Criteria

-   150개 이상 스타일 관리
-   3단계 카테고리 제공
-   추천 이유 표시
-   스타일 조합 검증
-   선택 결과 저장

------------------------------------------------------------------------

# Definition of Done

-   Style Library 구현
-   추천 로직 구현
-   API 테스트
-   UI 테스트
-   문서 업데이트

------------------------------------------------------------------------

# Claude Code Instructions

Style Engine은 ASTER의 핵심 경쟁력이다. 스타일 데이터는 하드코딩하지
말고 관리 가능한 구조로 설계한다. 추천 결과는 반드시 Brand Strategy와
연결되며, 모든 추천에 설명을 포함한다.

End of Document
