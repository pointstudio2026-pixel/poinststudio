-- Enable fuzzy string matching (levenshtein) for typo/spelling-variant tolerant industry search
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- CreateTable
CREATE TABLE "industry_translations" (
    "id" UUID NOT NULL,
    "industry_id" UUID NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "search_keywords" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "industry_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "industry_translations_industry_id_locale_key" ON "industry_translations"("industry_id", "locale");

-- CreateIndex
CREATE INDEX "industry_translations_locale_idx" ON "industry_translations"("locale");

-- AddForeignKey
ALTER TABLE "industry_translations" ADD CONSTRAINT "industry_translations_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
