-- CreateTable
CREATE TABLE "mockup_templates" (
    "id" UUID NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "background_url" TEXT NOT NULL,
    "placement_x_pct" DOUBLE PRECISION NOT NULL,
    "placement_y_pct" DOUBLE PRECISION NOT NULL,
    "placement_width_pct" DOUBLE PRECISION NOT NULL,
    "placement_height_pct" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mockup_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mockup_projects" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "generation_version_id" UUID NOT NULL,
    "source_image_index" INTEGER NOT NULL DEFAULT 0,
    "template_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "result_image_url" TEXT,
    "thumbnail_url" TEXT,
    "provider" VARCHAR(30),
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "cost_amount" DECIMAL(12,6),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "mockup_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mockup_templates_slug_key" ON "mockup_templates"("slug");

-- CreateIndex
CREATE INDEX "mockup_templates_category_idx" ON "mockup_templates"("category");

-- CreateIndex
CREATE INDEX "mockup_projects_project_id_created_at_idx" ON "mockup_projects"("project_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "mockup_projects" ADD CONSTRAINT "mockup_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mockup_projects" ADD CONSTRAINT "mockup_projects_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "mockup_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
