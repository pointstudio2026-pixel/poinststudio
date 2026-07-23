-- AlterTable: separate "이미지생성" reference data from "목업" reference data,
-- and allow matching by industry. Existing rows backfill to '이미지생성'
-- via the column default (they were all admin-submitted branding examples).
ALTER TABLE "training_examples" ADD COLUMN "category" VARCHAR(30) NOT NULL DEFAULT '이미지생성';
ALTER TABLE "training_examples" ADD COLUMN "industry" VARCHAR(30);

-- CreateIndex
CREATE INDEX "training_examples_category_idx" ON "training_examples"("category");
