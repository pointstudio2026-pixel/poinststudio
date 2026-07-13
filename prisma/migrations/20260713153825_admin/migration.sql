-- CreateTable
CREATE TABLE "system_announcements" (
    "id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivated_at" TIMESTAMPTZ,

    CONSTRAINT "system_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_announcements_active_created_at_idx" ON "system_announcements"("active", "created_at" DESC);
