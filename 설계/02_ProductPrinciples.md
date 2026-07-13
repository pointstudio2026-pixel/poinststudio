# 02_ProductPrinciples

**Project:** ASTER\
**Document:** Product Principles\
**Version:** 1.0

------------------------------------------------------------------------

# Purpose

이 문서는 ASTER의 모든 제품 설계와 개발 의사결정의 기준이다. 새로운
기능은 반드시 본 문서의 원칙을 만족해야 한다.

------------------------------------------------------------------------

# Product Principles

## 1. Designer First

모든 기능은 디자이너의 실제 작업 흐름을 기준으로 설계한다.

## 2. Direction Before Generation

이미지 생성보다 브랜드 방향성 설계를 우선한다.

## 3. Human Finalizes

AI는 참고용 컨셉을 제공하며 최종 디자인은 사람이 완성한다.

## 4. Explain Every Recommendation

추천에는 항상 이유와 근거를 제공한다.

## 5. Selection Over Prompt

긴 프롬프트 대신 선택 중심 UX를 제공한다.

## 6. Fast Feedback

첫 컨셉은 가능한 빠르게 제공하며 수정은 원클릭으로 수행한다.

## 7. Legal by Design

저작권, 상표권, 모방 위험을 줄이는 구조를 기본값으로 한다.

## 8. Extensible Architecture

AI 모델은 교체 가능하며 기능은 독립 모듈로 확장 가능해야 한다.

------------------------------------------------------------------------

# UX Principles

-   사용자는 3분 안에 브랜드 방향성을 이해한다.
-   사용자는 15분 안에 컨셉 자료를 확보한다.
-   모든 화면은 다음 행동이 명확해야 한다.
-   생성 결과는 항상 다시 수정할 수 있어야 한다.

------------------------------------------------------------------------

# Engineering Principles

-   TypeScript Strict
-   Clean Architecture
-   Domain 중심 설계
-   Adapter Pattern
-   테스트 가능한 구조
-   문서 우선 개발(Document First Development)

------------------------------------------------------------------------

# AI Principles

-   Brand Interview → Aster Brain → Brand Strategy → Generation 순서를
    유지한다.
-   프롬프트는 내부적으로 생성한다.
-   사용자 입력보다 구조화된 Brand Brief를 우선 사용한다.

------------------------------------------------------------------------

# Non-Principles

다음 방향은 채택하지 않는다.

-   AI가 모든 디자인을 대신 수행
-   무분별한 생성 횟수 경쟁
-   모방 중심 기능
-   설명 없는 추천

------------------------------------------------------------------------

# Definition of Success

ASTER는 다음을 달성하면 성공으로 본다.

-   아이디어 탐색 시간 단축
-   높은 구독 유지율
-   반복 사용 증가
-   디자이너의 실제 작업 효율 향상

End of Document
