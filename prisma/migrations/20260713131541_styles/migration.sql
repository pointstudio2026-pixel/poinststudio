-- CreateTable
CREATE TABLE "styles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "level" INTEGER NOT NULL,
    "parent_id" UUID,
    "category" VARCHAR(60) NOT NULL,
    "keywords" TEXT[],
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "style_selections" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "primary_style_id" UUID NOT NULL,
    "secondary_style_ids" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "style_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "style_favorites" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "style_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "style_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "styles_slug_key" ON "styles"("slug");

-- CreateIndex
CREATE INDEX "styles_category_level_idx" ON "styles"("category", "level");

-- CreateIndex
CREATE INDEX "style_selections_project_id_created_at_idx" ON "style_selections"("project_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "style_favorites_user_id_style_id_key" ON "style_favorites"("user_id", "style_id");

-- AddForeignKey
ALTER TABLE "styles" ADD CONSTRAINT "styles_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "styles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_selections" ADD CONSTRAINT "style_selections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_selections" ADD CONSTRAINT "style_selections_primary_style_id_fkey" FOREIGN KEY ("primary_style_id") REFERENCES "styles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_favorites" ADD CONSTRAINT "style_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_favorites" ADD CONSTRAINT "style_favorites_style_id_fkey" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
