# ASTER

디자이너를 위한 AI 브랜딩 플랫폼. 설계 문서는 [`설계/`](./설계), 기능 명세는
[`tasks/`](./tasks)를 참고한다. 멀티 에이전트 개발 계획은
`C:\Users\ohri1\.claude\plans\clever-chasing-firefly.md`에 있다.

## 스택

Next.js (App Router) · React · TypeScript(Strict) · Tailwind CSS · Prisma(PostgreSQL)
· Redis/BullMQ · Zod · React Hook Form · TanStack Query · Zustand · Vitest

## 개발 환경 준비

1. 의존성 설치: `npm install`
2. 로컬 인프라(Postgres/Redis/MinIO) 실행: `docker compose up -d`
3. `.env` 확인 (docker-compose 기본값과 일치하도록 이미 채워져 있음)
4. Prisma Client 생성: `npm run prisma:generate`
5. 개발 서버: `npm run dev`

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript strict 타입 검사 |
| `npm run test` | Vitest 실행 |
| `npm run prisma:migrate` | 마이그레이션 생성/적용 |
| `npm run prisma:studio` | Prisma Studio |

## Health Check

- `GET /api/health` — liveness
- `GET /api/health/ready` — readiness (DB/Redis 연결 확인)

## 폴더 구조

```
src/
├── app/            # Next.js App Router (route handlers 포함)
├── modules/        # 기능 도메인별 모듈 (Task 진행에 따라 추가됨)
├── shared/         # 공통 인프라 (errors, http, database, logging, queue, ...)
├── features/       # 프론트엔드 기능 모듈
├── components/      # 재사용 UI 컴포넌트
├── services/       # 프론트엔드 API 호출 계층
├── hooks/
├── stores/
├── lib/
└── types/
```

Route Handler에는 비즈니스 로직을 두지 않는다 (Use Case → Domain → Repository).
자세한 규칙은 `설계/23_BackendArchitecture.md`, `설계/24_FrontendArchitecture.md`,
`설계/30_CLAUDE.md`를 따른다.
