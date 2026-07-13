-- CreateTable
CREATE TABLE "brand_briefs" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "current_version_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "brand_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_brief_versions" (
    "id" UUID NOT NULL,
    "brand_brief_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "source" VARCHAR(30) NOT NULL DEFAULT 'ai',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_brief_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brand_briefs_project_id_key" ON "brand_briefs"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "brand_brief_versions_brand_brief_id_version_number_key" ON "brand_brief_versions"("brand_brief_id", "version_number");

-- AddForeignKey
ALTER TABLE "brand_briefs" ADD CONSTRAINT "brand_briefs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_brief_versions" ADD CONSTRAINT "brand_brief_versions_brand_brief_id_fkey" FOREIGN KEY ("brand_brief_id") REFERENCES "brand_briefs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_brief_versions" ADD CONSTRAINT "brand_brief_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
