# 22_DatabaseArchitecture

**Project:** ASTER\
**Document:** Database Architecture\
**Version:** 4.0\
**Status:** Draft

------------------------------------------------------------------------

# Purpose

이 문서는 ASTER의 핵심 데이터 모델, 테이블 관계, 버전 관리, 인덱스, 보안
정책을 정의한다.

모든 백엔드 구현과 데이터 마이그레이션은 본 문서를 기준으로 한다.

------------------------------------------------------------------------

# Database Choice

기본 데이터베이스는 PostgreSQL을 사용한다.

ORM은 Prisma를 우선 사용한다.

추가 저장소:

-   Redis: 캐시, 큐, 세션 보조
-   Object Storage: 생성 이미지, 목업, Export 파일
-   PostgreSQL: 구조화 데이터, 메타데이터, 이벤트 로그

------------------------------------------------------------------------

# Core Entity Relationship

``` text
User
 ├─ Subscription
 ├─ DesignMemory
 └─ Project
      ├─ ProjectVersion
      ├─ BrandInterview
      │    └─ InterviewAnswer
      ├─ BrandBrief
      │    └─ BrandBriefVersion
      ├─ BrandStrategy
      │    └─ BrandStrategyVersion
      ├─ StyleSelection
      ├─ PromptVersion
      ├─ Generation
      │    └─ GenerationVersion
      ├─ EditHistory
      ├─ ConceptBoard
      │    └─ ConceptBoardVersion
      ├─ MockupProject
      └─ ActivityLog
```

------------------------------------------------------------------------

# Core Tables

## users

``` sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  name VARCHAR(120),
  role VARCHAR(20) NOT NULL DEFAULT 'designer',
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

------------------------------------------------------------------------

## projects

``` sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  current_step VARCHAR(50) NOT NULL DEFAULT 'brand_interview',
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

------------------------------------------------------------------------

## project_versions

``` sql
CREATE TABLE project_versions (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, version_number)
);
```

------------------------------------------------------------------------

## brand_interviews

``` sql
CREATE TABLE brand_interviews (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  current_question_index INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

------------------------------------------------------------------------

## interview_answers

``` sql
CREATE TABLE interview_answers (
  id UUID PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES brand_interviews(id),
  question_key VARCHAR(100) NOT NULL,
  question_text TEXT NOT NULL,
  answer JSONB,
  sequence INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## brand_briefs

``` sql
CREATE TABLE brand_briefs (
  id UUID PRIMARY KEY,
  project_id UUID UNIQUE NOT NULL REFERENCES projects(id),
  current_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## brand_brief_versions

``` sql
CREATE TABLE brand_brief_versions (
  id UUID PRIMARY KEY,
  brand_brief_id UUID NOT NULL REFERENCES brand_briefs(id),
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  source VARCHAR(30) NOT NULL DEFAULT 'ai',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand_brief_id, version_number)
);
```

------------------------------------------------------------------------

## brand_strategies

``` sql
CREATE TABLE brand_strategies (
  id UUID PRIMARY KEY,
  project_id UUID UNIQUE NOT NULL REFERENCES projects(id),
  current_version_id UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## brand_strategy_versions

``` sql
CREATE TABLE brand_strategy_versions (
  id UUID PRIMARY KEY,
  brand_strategy_id UUID NOT NULL REFERENCES brand_strategies(id),
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  reasoning_summary TEXT,
  confidence VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand_strategy_id, version_number)
);
```

------------------------------------------------------------------------

## styles

``` sql
CREATE TABLE styles (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES styles(id),
  level SMALLINT NOT NULL,
  slug VARCHAR(120) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## style_relations

``` sql
CREATE TABLE style_relations (
  id UUID PRIMARY KEY,
  source_style_id UUID NOT NULL REFERENCES styles(id),
  target_style_id UUID NOT NULL REFERENCES styles(id),
  relation_type VARCHAR(30) NOT NULL,
  weight NUMERIC(5,2),
  UNIQUE(source_style_id, target_style_id, relation_type)
);
```

------------------------------------------------------------------------

## style_selections

``` sql
CREATE TABLE style_selections (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  primary_style_id UUID NOT NULL REFERENCES styles(id),
  secondary_style_ids UUID[] NOT NULL DEFAULT '{}',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## prompt_versions

``` sql
CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  prompt_hash VARCHAR(128) NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  safety_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## generations

``` sql
CREATE TABLE generations (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  prompt_version_id UUID NOT NULL REFERENCES prompt_versions(id),
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  cost_amount NUMERIC(12,6),
  cost_currency VARCHAR(10) DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

------------------------------------------------------------------------

## generation_versions

``` sql
CREATE TABLE generation_versions (
  id UUID PRIMARY KEY,
  generation_id UUID NOT NULL REFERENCES generations(id),
  version_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  parent_version_id UUID REFERENCES generation_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(generation_id, version_number)
);
```

------------------------------------------------------------------------

## edit_history

``` sql
CREATE TABLE edit_history (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  source_generation_version_id UUID NOT NULL REFERENCES generation_versions(id),
  result_generation_version_id UUID REFERENCES generation_versions(id),
  action_key VARCHAR(100) NOT NULL,
  action_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## concept_boards

``` sql
CREATE TABLE concept_boards (
  id UUID PRIMARY KEY,
  project_id UUID UNIQUE NOT NULL REFERENCES projects(id),
  current_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## concept_board_versions

``` sql
CREATE TABLE concept_board_versions (
  id UUID PRIMARY KEY,
  concept_board_id UUID NOT NULL REFERENCES concept_boards(id),
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(concept_board_id, version_number)
);
```

------------------------------------------------------------------------

## mockup_projects

``` sql
CREATE TABLE mockup_projects (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  template_id UUID NOT NULL,
  data JSONB NOT NULL,
  preview_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## subscriptions

``` sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  plan_code VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  provider_customer_id VARCHAR(255),
  provider_subscription_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## usage_logs

``` sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  event_type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  cost_amount NUMERIC(12,6),
  cost_currency VARCHAR(10) DEFAULT 'USD',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## design_memory

``` sql
CREATE TABLE design_memory (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## activity_logs

``` sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  event_type VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

# Index Strategy

필수 인덱스:

``` sql
CREATE INDEX idx_projects_user_updated
ON projects(user_id, updated_at DESC);

CREATE INDEX idx_generations_project_created
ON generations(project_id, created_at DESC);

CREATE INDEX idx_usage_logs_user_created
ON usage_logs(user_id, created_at DESC);

CREATE INDEX idx_activity_logs_project_created
ON activity_logs(project_id, created_at DESC);

CREATE INDEX idx_styles_parent_level
ON styles(parent_id, level);
```

------------------------------------------------------------------------

# Soft Delete Policy

다음 엔티티는 Soft Delete를 기본으로 한다.

-   users
-   projects
-   generated assets

삭제된 데이터는 기본 조회에서 제외한다.

관리자 복구 정책은 별도 Admin 문서에서 정의한다.

------------------------------------------------------------------------

# Versioning Policy

다음 데이터는 수정 시 기존 데이터를 덮어쓰지 않고 새 버전을 생성한다.

-   Brand Brief
-   Brand Strategy
-   Generation
-   Concept Board
-   Project Snapshot

------------------------------------------------------------------------

# Data Ownership

-   모든 프로젝트 데이터는 user_id를 통해 소유자를 추적한다.
-   타 사용자의 데이터 접근은 서버에서 차단한다.
-   Admin 접근은 감사 로그에 기록한다.

------------------------------------------------------------------------

# Security Rules

-   민감 데이터는 암호화한다.
-   인증 토큰 원문은 저장하지 않는다.
-   외부 Provider Key는 환경변수 또는 Secret Manager에 저장한다.
-   Row Level Security 적용 가능 구조를 유지한다.

------------------------------------------------------------------------

# Retention Policy

-   휴지통 프로젝트: 기본 30일 보관
-   결제 로그: 법적·회계 정책에 따라 보관
-   AI 원가 로그: 최소 12개월 보관
-   사용자가 계정 삭제를 요청하면 법적 보관 의무를 제외하고 삭제한다.

------------------------------------------------------------------------

# Migration Rules

-   모든 스키마 변경은 Migration 파일로 관리한다.
-   운영 DB에 직접 수동 변경하지 않는다.
-   Breaking Migration은 백업과 롤백 계획을 포함한다.

------------------------------------------------------------------------

# Acceptance Criteria

-   모든 핵심 도메인이 DB 엔티티와 연결된다.
-   프로젝트 데이터가 사용자별로 격리된다.
-   버전 복원이 가능하다.
-   생성 원가를 이벤트 단위로 추적할 수 있다.
-   Style 3단계 분류를 저장할 수 있다.

------------------------------------------------------------------------

# Definition of Done

-   Prisma Schema 작성
-   초기 Migration 생성
-   Seed Script 작성
-   핵심 인덱스 적용
-   데이터 격리 테스트
-   버전 복원 테스트
-   문서 업데이트

------------------------------------------------------------------------

# Claude Code Instructions

1.  본 문서를 읽은 후 Prisma Schema를 작성한다.
2.  JSONB는 확장 가능 데이터에만 사용하며 핵심 식별 필드는 명시적
    컬럼으로 둔다.
3.  모든 외래키 삭제 정책을 명시한다.
4.  사용자 소유 데이터 조회에는 항상 user_id 조건을 포함한다.
5.  Migration, Seed, 테스트를 함께 작성한다.

End of Document
