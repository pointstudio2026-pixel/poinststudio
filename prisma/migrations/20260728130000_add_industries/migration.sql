-- CreateTable
CREATE TABLE "industries" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "seo_slug" VARCHAR(160) NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "description" TEXT NOT NULL,
    "recommended_colors" TEXT[],
    "recommended_logo_styles" TEXT[],
    "recommended_typography" TEXT[],
    "recommended_personality" TEXT[],
    "recommended_keywords" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "industries_name_key" ON "industries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "industries_seo_slug_key" ON "industries"("seo_slug");

-- CreateIndex
CREATE INDEX "industries_category_idx" ON "industries"("category");
