-- CreateTable
CREATE TABLE "logo_style_categories" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "description" TEXT NOT NULL,
    "sub_styles" TEXT[],
    "keywords" TEXT[],
    "sample_image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logo_style_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logo_style_selections" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "category_ids" TEXT[],
    "primary_category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logo_style_selections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "logo_style_categories_slug_key" ON "logo_style_categories"("slug");

-- CreateIndex
CREATE INDEX "logo_style_selections_project_id_created_at_idx" ON "logo_style_selections"("project_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "logo_style_selections" ADD CONSTRAINT "logo_style_selections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logo_style_selections" ADD CONSTRAINT "logo_style_selections_primary_category_id_fkey" FOREIGN KEY ("primary_category_id") REFERENCES "logo_style_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
