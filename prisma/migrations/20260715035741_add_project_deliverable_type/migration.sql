-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "deliverable_type" VARCHAR(30),
ALTER COLUMN "current_step" SET DEFAULT 'deliverable_type';
