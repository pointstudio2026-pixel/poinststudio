-- AlterTable
ALTER TABLE "projects" ADD COLUMN "is_standalone_mockup" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "standalone_mockups" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "source_type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'completed',
    "result_image_url" TEXT,
    "thumbnail_url" TEXT,
    "provider" VARCHAR(30),
    "error_message" TEXT,
    "cost_amount" DECIMAL(12,6),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "standalone_mockups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "standalone_mockups_user_id_created_at_idx" ON "standalone_mockups"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "standalone_mockups" ADD CONSTRAINT "standalone_mockups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standalone_mockups" ADD CONSTRAINT "standalone_mockups_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standalone_mockups" ADD CONSTRAINT "standalone_mockups_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "mockup_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
