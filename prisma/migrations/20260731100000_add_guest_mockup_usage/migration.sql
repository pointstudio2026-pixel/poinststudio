-- 게스트(비로그인) "목업" 단독 프로세스가 만드는 Project/StandaloneMockup의
-- FK 소유자로 쓸 고정 시스템 게스트 User 1행. password_hash가 NULL이고
-- oauth_accounts 연결도 없어서 로그인 경로로는 절대 도달할 수 없다.
-- id는 src/modules/mockups/domain/guestMockup.ts의 SYSTEM_GUEST_USER_ID와
-- 반드시 동일해야 한다 -- 절대 삭제 금지(onDelete: Cascade라 삭제 시
-- 아직 회원가입으로 이전(claim)되지 않은 게스트 목업이 전부 같이 삭제됨).
INSERT INTO "users" ("id", "email", "password_hash", "name", "role", "created_at", "updated_at")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'system-guest@internal.aster.local',
  NULL,
  'System Guest (internal)',
  'designer',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- CreateTable
CREATE TABLE "guest_mockup_usage" (
    "id" UUID NOT NULL,
    "guest_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "standalone_mockup_id" UUID NOT NULL,
    "request_ip" VARCHAR(64),
    "claimed_at" TIMESTAMPTZ,
    "claimed_by_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_mockup_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_mockup_usage_project_id_key" ON "guest_mockup_usage"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "guest_mockup_usage_standalone_mockup_id_key" ON "guest_mockup_usage"("standalone_mockup_id");

-- CreateIndex
CREATE INDEX "guest_mockup_usage_guest_id_claimed_at_idx" ON "guest_mockup_usage"("guest_id", "claimed_at");

-- AddForeignKey
ALTER TABLE "guest_mockup_usage" ADD CONSTRAINT "guest_mockup_usage_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_mockup_usage" ADD CONSTRAINT "guest_mockup_usage_standalone_mockup_id_fkey" FOREIGN KEY ("standalone_mockup_id") REFERENCES "standalone_mockups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_mockup_usage" ADD CONSTRAINT "guest_mockup_usage_claimed_by_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
