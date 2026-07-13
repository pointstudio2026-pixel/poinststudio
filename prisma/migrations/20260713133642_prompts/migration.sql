-- CreateTable
CREATE TABLE "prompts" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "current_version_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_versions" (
    "id" UUID NOT NULL,
    "prompt_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "provider" VARCHAR(30) NOT NULL,
    "system_prompt" TEXT NOT NULL,
    "user_prompt" TEXT NOT NULL,
    "hash" VARCHAR(64) NOT NULL,
    "payload" JSONB NOT NULL,
    "flagged_terms" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prompts_project_id_key" ON "prompts"("project_id");

-- CreateIndex
CREATE INDEX "prompt_versions_hash_idx" ON "prompt_versions"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_versions_prompt_id_version_number_key" ON "prompt_versions"("prompt_id", "version_number");

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
