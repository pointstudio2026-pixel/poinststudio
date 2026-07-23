-- AlterTable: hard-constraint fields (all additive, backward compatible)
ALTER TABLE "style_selections" ADD COLUMN "forbidden_style_ids" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "color_palette_selections" ADD COLUMN "forbidden_colors" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "logo_style_selections" ADD COLUMN "forbidden_category_ids" TEXT[] NOT NULL DEFAULT '{}';

-- AlterTable: training_examples evaluation + source tracking
ALTER TABLE "training_examples" ADD COLUMN "evaluation_score" DOUBLE PRECISION;
ALTER TABLE "training_examples" ADD COLUMN "evaluation_breakdown" JSONB;
ALTER TABLE "training_examples" ADD COLUMN "evaluated_at" TIMESTAMPTZ;
ALTER TABLE "training_examples" ADD COLUMN "source" VARCHAR(20) NOT NULL DEFAULT 'ADMIN';
ALTER TABLE "training_examples" ADD COLUMN "source_generation_version_id" UUID;

-- CreateIndex
CREATE INDEX "training_examples_evaluation_score_idx" ON "training_examples"("evaluation_score");

-- CreateTable
CREATE TABLE "prompt_decision_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prompt_version_id" UUID NOT NULL,
    "hard_constraints" JSONB NOT NULL,
    "soft_preferences" JSONB NOT NULL,
    "db_candidates_found" JSONB NOT NULL,
    "db_candidates_used" JSONB NOT NULL,
    "conflicts" JSONB NOT NULL DEFAULT '[]',
    "compliance_check" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_decision_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prompt_decision_records_prompt_version_id_key" ON "prompt_decision_records"("prompt_version_id");

-- AddForeignKey
ALTER TABLE "prompt_decision_records" ADD CONSTRAINT "prompt_decision_records_prompt_version_id_fkey" FOREIGN KEY ("prompt_version_id") REFERENCES "prompt_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "generation_evaluations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "generation_version_id" UUID NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PROMPT_LEVEL_ONLY',
    "hard_constraint_passed" BOOLEAN NOT NULL,
    "issues" JSONB NOT NULL DEFAULT '[]',
    "usage_score" DOUBLE PRECISION,
    "promoted_to_reference" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generation_evaluations_generation_version_id_key" ON "generation_evaluations"("generation_version_id");

-- AddForeignKey
ALTER TABLE "generation_evaluations" ADD CONSTRAINT "generation_evaluations_generation_version_id_fkey" FOREIGN KEY ("generation_version_id") REFERENCES "generation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "generation_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "generation_version_id" UUID NOT NULL,
    "liked_tags" TEXT[] NOT NULL DEFAULT '{}',
    "disliked_tags" TEXT[] NOT NULL DEFAULT '{}',
    "free_text" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generation_feedback_generation_version_id_key" ON "generation_feedback"("generation_version_id");

-- AddForeignKey
ALTER TABLE "generation_feedback" ADD CONSTRAINT "generation_feedback_generation_version_id_fkey" FOREIGN KEY ("generation_version_id") REFERENCES "generation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
