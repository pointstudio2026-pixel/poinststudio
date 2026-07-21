-- AlterTable
ALTER TABLE "brand_strategy_versions" ADD COLUMN     "candidates" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "selected_index" INTEGER;
