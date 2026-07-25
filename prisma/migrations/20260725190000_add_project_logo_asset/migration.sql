-- CreateTable
CREATE TABLE "project_logo_assets" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "content_type" VARCHAR(50) NOT NULL,
    "original_file_name" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_logo_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_logo_assets_project_id_key" ON "project_logo_assets"("project_id");

-- AddForeignKey
ALTER TABLE "project_logo_assets" ADD CONSTRAINT "project_logo_assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
