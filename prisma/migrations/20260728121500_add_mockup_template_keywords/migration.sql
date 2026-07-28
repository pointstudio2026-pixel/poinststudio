-- AlterTable
ALTER TABLE "mockup_templates" ADD COLUMN "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
