-- AlterTable: user-generation promotions no longer store an image file
-- (2026-07-24 decision) -- only the prompt text is ever read by
-- rankTrainingExamples, so the image was purely for admin preview.
-- Admin-entered rows (source="ADMIN") still require an image at the
-- application level (CreateTrainingExampleUseCase), this is a DB-level
-- relaxation only.
ALTER TABLE "training_examples" ALTER COLUMN "image_storage_key" DROP NOT NULL;
ALTER TABLE "training_examples" ALTER COLUMN "image_content_type" DROP NOT NULL;

-- CreateIndex: covers BuildPromptUseCase/ProcessMockupJobUseCase's real
-- query shape (deliverableType + category + industry) so retrieval stays
-- fast regardless of total row count.
CREATE INDEX "training_examples_deliverable_type_category_industry_idx" ON "training_examples"("deliverable_type", "category", "industry");
