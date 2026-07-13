-- CreateTable
CREATE TABLE "brand_interviews" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    "current_question_index" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "brand_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_answers" (
    "id" UUID NOT NULL,
    "interview_id" UUID NOT NULL,
    "question_key" VARCHAR(100) NOT NULL,
    "question_text" TEXT NOT NULL,
    "answer" JSONB,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "interview_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brand_interviews_project_id_idx" ON "brand_interviews"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "interview_answers_interview_id_question_key_key" ON "interview_answers"("interview_id", "question_key");

-- AddForeignKey
ALTER TABLE "brand_interviews" ADD CONSTRAINT "brand_interviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_answers" ADD CONSTRAINT "interview_answers_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "brand_interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
