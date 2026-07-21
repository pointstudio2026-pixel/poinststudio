-- CreateTable
CREATE TABLE "user_style_categories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_style_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_style_references" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "content_type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_style_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_user_style_selections" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_style_category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_user_style_selections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_style_categories_user_id_created_at_idx" ON "user_style_categories"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "project_user_style_selections_project_id_created_at_idx" ON "project_user_style_selections"("project_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "user_style_categories" ADD CONSTRAINT "user_style_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_style_references" ADD CONSTRAINT "user_style_references_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "user_style_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_user_style_selections" ADD CONSTRAINT "project_user_style_selections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_user_style_selections" ADD CONSTRAINT "project_user_style_selections_user_style_category_id_fkey" FOREIGN KEY ("user_style_category_id") REFERENCES "user_style_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
