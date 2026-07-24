-- AlterTable: GPT Vision-based generation judgment (2026-07-24 user
-- approval). Populated once, right after generation completes, by
-- EvaluateGenerationVisionUseCase -- best-effort, so both columns stay
-- nullable (a failed Vision call just leaves them null, generation still
-- succeeds).
ALTER TABLE "generation_evaluations" ADD COLUMN "vision_score" DOUBLE PRECISION;
ALTER TABLE "generation_evaluations" ADD COLUMN "vision_evaluation" JSONB;
