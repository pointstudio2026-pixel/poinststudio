-- CreateEnum
CREATE TYPE "landing_article_status" AS ENUM ('draft', 'published');

-- CreateTable
CREATE TABLE "landing_article_groups" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landing_article_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_article_translations" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "display_title" VARCHAR(200) NOT NULL,
    "meta_description" VARCHAR(300) NOT NULL,
    "content" JSONB NOT NULL,
    "status" "landing_article_status" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "landing_article_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landing_article_groups_slug_key" ON "landing_article_groups"("slug");

-- CreateIndex
CREATE INDEX "landing_article_groups_category_idx" ON "landing_article_groups"("category");

-- CreateIndex
CREATE INDEX "landing_article_translations_locale_status_idx" ON "landing_article_translations"("locale", "status");

-- CreateIndex
CREATE UNIQUE INDEX "landing_article_translations_group_id_locale_key" ON "landing_article_translations"("group_id", "locale");

-- AddForeignKey
ALTER TABLE "landing_article_translations" ADD CONSTRAINT "landing_article_translations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "landing_article_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
