-- CreateTable
CREATE TABLE "export_jobs" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "source" VARCHAR(20) NOT NULL,
    "format" VARCHAR(10) NOT NULL,
    "source_ref_id" UUID,
    "sections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "include_brand_info" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "file_key" TEXT,
    "file_size_bytes" INTEGER,
    "watermarked" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "export_jobs_project_id_created_at_idx" ON "export_jobs"("project_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
